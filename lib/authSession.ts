import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import authStorage from "../app/utils/authStorage";

const LAST_SESSION_USER_KEY = "session_last_user_id";

export const AUTH_SESSION_USER_CHANGED = "auth-session-user-changed";

export type AuthInvalidateReason =
  | "manual_logout"
  | "refresh_token_expired"
  | "stored_tokens_missing"
  | "profile_api_token_invalid_after_refresh";

export const logAuthEvent = (
  event: string,
  detail?: Record<string, unknown>
) => {
  if (detail) {
    console.log(`[auth] ${event}`, detail);
    return;
  }
  console.log(`[auth] ${event}`);
};

export const isApiTokenInvalidResponse = (
  status: number,
  data: unknown
): boolean => {
  if (status !== 401) return false;

  const payload = (data ?? {}) as Record<string, unknown>;
  if (payload.code === "token_not_valid") return true;

  const detail = String(payload.detail || "").toLowerCase();
  if (detail.includes("token") && detail.includes("valid")) return true;

  const messages = payload.messages;
  if (Array.isArray(messages)) {
    return messages.some((entry) => {
      const message =
        typeof entry === "string"
          ? entry
          : String((entry as Record<string, unknown>)?.message || "");
      const normalized = message.toLowerCase();
      return normalized.includes("token") && normalized.includes("valid");
    });
  }

  return false;
};

export const shouldInvalidateStoredSession = async (): Promise<boolean> => {
  const tokens = await authStorage.getTokens();
  if (!tokens?.access && !tokens?.refresh) {
    return false;
  }

  const refresh = tokens.refresh?.trim();
  if (refresh) {
    return !authStorage.isJwtNotExpired(refresh);
  }

  const access = tokens.access?.trim();
  if (access) {
    return !authStorage.isJwtNotExpired(access);
  }

  return true;
};

export const invalidateAuthSession = async (
  reason: AuthInvalidateReason,
  detail?: Record<string, unknown>
) => {
  logAuthEvent("invalidateAuthSession", { reason, ...detail });
  await authStorage.clearTokens();
  await clearSessionUserMarker();
  await AsyncStorage.setItem("is_logged_in", "false");
  notifySessionUserChanged(null);
};

let refreshInFlight: Promise<string | null> | null = null;

export const tryRefreshStoredAccessToken = async (): Promise<string | null> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
  const tokens = await authStorage.getTokens();
  const refresh = tokens?.refresh?.trim();
  if (!refresh || !authStorage.isJwtNotExpired(refresh)) {
    logAuthEvent("refresh_skipped", {
      hasRefresh: Boolean(refresh),
      refreshExpired: refresh ? !authStorage.isJwtNotExpired(refresh) : true,
    });
    return null;
  }

  try {
    const { API } = await import("./api");
    const data = await API.refreshAccessToken(refresh);
    const access = String(data?.access || "").trim();
    if (!access) {
      logAuthEvent("refresh_failed", { reason: "missing_access_in_response" });
      return null;
    }

    await authStorage.setTokens({
      access,
      refresh: String(data?.refresh || refresh).trim(),
    });
    logAuthEvent("refresh_succeeded");
    return access;
  } catch (error) {
    logAuthEvent("refresh_failed", {
      reason: "request_error",
      error: String(error),
    });
    return null;
  }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

export const resolveStoredAccessToken = async (): Promise<string | null> => {
  const tokens = await authStorage.getTokens();
  const access = tokens?.access?.trim();
  if (access && authStorage.isJwtNotExpired(access)) {
    return access;
  }

  return tryRefreshStoredAccessToken();
};

export const getLastSessionUserId = async (): Promise<string | null> => {
  const raw = await AsyncStorage.getItem(LAST_SESSION_USER_KEY);
  return raw || null;
};

export const clearSessionUserMarker = async () => {
  await AsyncStorage.removeItem(LAST_SESSION_USER_KEY);
};

export const notifySessionUserChanged = (userId: string | null) => {
  DeviceEventEmitter.emit(AUTH_SESSION_USER_CHANGED, { userId });
};

export const markSessionUser = async (userId: string) => {
  await AsyncStorage.setItem(LAST_SESSION_USER_KEY, userId);
  notifySessionUserChanged(userId);
};
