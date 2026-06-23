import { router } from "expo-router";
import authStorage from "../app/utils/authStorage";
import { API } from "./api";

type CompleteSessionInput = {
  username: string;
  email: string;
  access?: string;
  refresh?: string;
  password?: string;
};

/** Persist tokens and hydrate local profile after successful auth. */
export async function completeAuthSession({
  username,
  email,
  access: providedAccess,
  refresh: providedRefresh,
  password,
}: CompleteSessionInput): Promise<boolean> {
  let access = providedAccess;
  let refresh = providedRefresh;

  if (!access && password) {
    const loginResult = await API.login(username, password);
    access = loginResult?.access || loginResult?.tokens?.access;
    refresh = loginResult?.refresh || loginResult?.tokens?.refresh;
  }

  if (!access) {
    return false;
  }

  await authStorage.setTokens({ access, refresh });

  const userId = authStorage.getUserIdStringFromAccessToken(access);
  if (userId) {
    const { prepareSessionForUser, saveUserProfile } = await import(
      "./userSessionStorage"
    );
    await saveUserProfile(userId, {
      id: userId,
      user_id: userId,
      username,
      email,
      email_verified: true,
      is_email_verified: true,
    });
    await prepareSessionForUser(userId, { username, email });
  }

  return true;
}

export async function completeAuthSessionAndGoToProfile(
  input: CompleteSessionInput
): Promise<void> {
  const ok = await completeAuthSession(input);
  if (!ok) {
    throw new Error("session_incomplete");
  }
  router.replace("/(tabs)/profile");
}
