// app/utils/authStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "authTokens";

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
    if (!value) return null;
    return JSON.parse(value) as AuthTokens;
  } catch (error) {
    console.log("Error getting auth tokens:", error);
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