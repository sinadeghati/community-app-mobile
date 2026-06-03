import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "user_settings_v1";

export type AppLanguage = "en" | "fa-preview";

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
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
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
