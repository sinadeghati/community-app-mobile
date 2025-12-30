import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

const KEY = "authTokens_v2";

export type Tokens = {
  access: string;
  refresh?: string;
};

async function setTokens(tokens: Tokens | null | undefined) {
  // اگر توکن معتبر نداریم، پاک کن
  if (!tokens?.access) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(tokens));
}

async function getTokens(): Promise<Tokens | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function clearTokens() {
  await AsyncStorage.removeItem(KEY);
}

// ✅ این تابع فقط همینجا و فقط یک بار تعریف بشه
function getUserIdFromAccessToken(accessToken?: string | null): number | null {
  try {
    if (!accessToken) return null;

    const parts = accessToken.split(".");
    if (parts.length < 2) return null;

    // base64url -> base64
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);

    const jsonStr = Buffer.from(payload, "base64").toString("utf8");
    const data = JSON.parse(jsonStr);

    // بعضی JWT ها user_id دارن، بعضی id
    const uid = data.user_id ?? data.id;
    return typeof uid === "number" ? uid : Number(uid) || null;
  } catch {
    return null;
  }
}

// برای سازگاری با کد قبلی (login.tsx و ...)
async function storeTokens(tokens: Tokens | null | undefined) {
  return setTokens(tokens);
}

export default {
  setTokens,
  storeTokens,
  getTokens,
  clearTokens,
  getUserIdFromAccessToken, // ✅ حتما داخل default export باشه
};
