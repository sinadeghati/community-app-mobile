import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeStoredLocale } from "../../lib/i18n/resources";

const KEY = "user_settings_v1";

export type AppLanguage = "en" | "fa";

export type UserSettings = {
  notifications?: boolean;
  locationVisibility?: boolean;
  profileVisibility?: boolean;
  language?: AppLanguage;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: true,
  locationVisibility: true,
  profileVisibility: true,
  language: "en",
};

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_USER_SETTINGS };
    const parsed = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
    return {
      ...parsed,
      language: normalizeStoredLocale(parsed.language),
    };
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

export async function saveUserSettings(
  partial: Partial<UserSettings>
): Promise<UserSettings> {
  const current = await loadUserSettings();
  const updated = { ...current, ...partial };
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
