import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "deleted_business_ids_v1";

export const loadDeletedBusinessIds = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(
      parsed.map((id) => String(id || "").trim()).filter(Boolean)
    );
  } catch {
    return new Set();
  }
};

export const markBusinessDeleted = async (businessId: string): Promise<void> => {
  const id = String(businessId || "").trim();
  if (!id) return;

  const deleted = await loadDeletedBusinessIds();
  deleted.add(id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...deleted]));
};

export const isDeletedBusinessId = (
  businessId: string,
  deletedIds?: Set<string> | null
): boolean => {
  const id = String(businessId || "").trim();
  if (!id || !deletedIds) return false;
  return deletedIds.has(id);
};

/** Dev/staging cleanup only — clears local tombstone registry. */
export const clearDeletedBusinessRegistry = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
