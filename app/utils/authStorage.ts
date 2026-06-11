import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";

const KEY = "authTokens_v2";
const LEGACY_ASYNC_KEY = "authTokens_v2";

export type Tokens = {
  access: string;
  refresh?: string;
};

type JwtPayload = Record<string, unknown>;

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);

    const jsonStr = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
};

const readSecure = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
};

const writeSecure = async (value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    await AsyncStorage.setItem(LEGACY_ASYNC_KEY, value);
  }
};

const removeSecure = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
};

const migrateLegacyTokens = async (): Promise<string | null> => {
  const legacy = await AsyncStorage.getItem(LEGACY_ASYNC_KEY);
  if (!legacy) return null;

  await writeSecure(legacy);
  await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
  return legacy;
};

async function setTokens(tokens: Tokens | null | undefined) {
  if (!tokens?.access) {
    await removeSecure();
    return;
  }

  const normalized: Tokens = {
    access: String(tokens.access).trim(),
    ...(tokens.refresh ? { refresh: String(tokens.refresh).trim() } : {}),
  };

  await writeSecure(JSON.stringify(normalized));
  await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
}

async function getTokens(): Promise<Tokens | null> {
  let raw = await readSecure();
  if (!raw) {
    raw = await migrateLegacyTokens();
  }
  if (!raw) {
    raw = await AsyncStorage.getItem(LEGACY_ASYNC_KEY);
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Tokens;
    if (!parsed?.access) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function clearTokens() {
  await removeSecure();
}

function getUserIdFromAccessToken(accessToken?: string | null): number | null {
  const data = accessToken ? decodeJwtPayload(accessToken) : null;
  if (!data) return null;

  const raw =
    data.user_id ??
    data.id ??
    data.sub ??
    data.userId ??
    data.pk ??
    null;

  if (raw == null || raw === "") return null;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function getUserIdStringFromAccessToken(
  accessToken?: string | null
): string | null {
  const numeric = getUserIdFromAccessToken(accessToken);
  if (numeric != null) return String(numeric);

  const data = accessToken ? decodeJwtPayload(accessToken) : null;
  if (!data) return null;

  const raw =
    data.user_id ??
    data.id ??
    data.sub ??
    data.userId ??
    data.pk ??
    null;

  if (raw == null || raw === "") return null;
  return String(raw);
}

function isJwtNotExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const exp = payload.exp;
  if (exp == null) return true;

  const expSeconds = typeof exp === "number" ? exp : Number(exp);
  if (!Number.isFinite(expSeconds)) return true;

  return Date.now() < expSeconds * 1000;
}

async function storeTokens(tokens: Tokens | null | undefined) {
  return setTokens(tokens);
}

export default {
  setTokens,
  storeTokens,
  getTokens,
  clearTokens,
  getUserIdFromAccessToken,
  getUserIdStringFromAccessToken,
  isJwtNotExpired,
  decodeJwtPayload,
};
