// app/utils/authStorage.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// ذخیره کردن توکن‌ها
export async function saveTokens(accessToken: string, refreshToken: string) {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    console.log('✅ Tokens saved in SecureStore');
  } catch (error) {
    console.log('❌ Error saving tokens', error);
  }
}

// گرفتن توکن‌ها
export async function getTokens() {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    console.log('📥 Tokens loaded from SecureStore');
    return { accessToken, refreshToken };
  } catch (error) {
    console.log('❌ Error loading tokens', error);
    return { accessToken: null, refreshToken: null };
  }
}

// پاک کردن توکن‌ها (برای Logout)
export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    console.log('🗑️ Tokens removed from SecureStore');
  } catch (error) {
    console.log('❌ Error removing tokens', error);
  }
}
