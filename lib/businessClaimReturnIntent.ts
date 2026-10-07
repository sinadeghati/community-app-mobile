import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "pending_business_claim_return_v1";

export type PendingBusinessClaimReturn = {
  routeProfileId: string;
  serverListingId: string;
  openClaimModal: boolean;
  savedAt: number;
};

export const savePendingBusinessClaimReturn = async (
  intent: Omit<PendingBusinessClaimReturn, "savedAt">
): Promise<void> => {
  const payload: PendingBusinessClaimReturn = {
    ...intent,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const peekPendingBusinessClaimReturn =
  async (): Promise<PendingBusinessClaimReturn | null> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PendingBusinessClaimReturn;
      if (
        !parsed?.routeProfileId ||
        !parsed?.serverListingId ||
        !parsed.openClaimModal
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

export const consumePendingBusinessClaimReturn = async (
  match?: { routeProfileId?: string; serverListingId?: string }
): Promise<PendingBusinessClaimReturn | null> => {
  const pending = await peekPendingBusinessClaimReturn();
  if (!pending) return null;

  if (match?.routeProfileId && pending.routeProfileId !== match.routeProfileId) {
    return null;
  }
  if (match?.serverListingId && pending.serverListingId !== match.serverListingId) {
    return null;
  }

  await AsyncStorage.removeItem(STORAGE_KEY);
  return pending;
};

export const clearPendingBusinessClaimReturn = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
