// app/utils/authStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "authTokens_v2";

export type AuthTokens = {
  access: string;
  refresh?: string;
};

async function storeTokens(tokens: AuthTokens) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.log("Error storing auth tokens:", error);
  }
}

async function getTokens(): Promise<AuthTokens | null> {
  try {
    const value = await AsyncStorage.getItem(TOKEN_KEY);
    if (!value) return null;   // 👈 این خط باید !value باشه
    return JSON.parse(value) as AuthTokens;
  } catch (error) {
    console.log("Error getting auth tokens:", error);
    return null;
  }
}

export function getUserIdFromAccessToken(
  access?: string | null
): number | null {
  try {
    if (!access) return null;

    const payload = access.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    return decoded.user_id ?? decoded.id ?? null;
  } catch (e) {
    console.log("Failed to decode access token", e);
    return null;
  }
}



async function clearTokens() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.log("Error clearing auth tokens:", error);
  }
}

const authStorage = { storeTokens, getTokens, clearTokens };

export default authStorage;