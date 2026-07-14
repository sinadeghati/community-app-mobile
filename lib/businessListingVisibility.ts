import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type DiscoverableListing,
  getListingId,
  isEventListing,
} from "./discoverableListings";
import {
  isDeletedBusinessId,
  loadDeletedBusinessIds,
  markBusinessDeleted,
} from "./deletedBusinessRegistry";
import { removeBusinessFromDiscoverCache } from "./discoverListingsCache";
import { requestDiscoverListingsRefresh } from "./discoverListingsRefresh";
import { getMapLat } from "./mapCoordinates";
import {
  businessIdsFrom,
  logDiscoverContextStage,
  logDiscoverListStage,
} from "./discoverListTrace";

export type DisplayableListingContext = {
  deletedIds: Set<string>;
  ownedIds: Set<string>;
  profileStorageIds: Set<string>;
  userId?: string | null;
};

export const getDiscoverableListingTitle = (item: DiscoverableListing) =>
  String(item.business_name || item.name || item.title || "").trim();

const isDeletedBusinessRecord = (item: Record<string, unknown>) =>
  Boolean(item.deleted || item._deleted || item.is_deleted);

const isRecordOwnedByCurrentUser = (
  record: Record<string, unknown>,
  userId: string
) => {
  const ownerId = String(record.owner_id ?? record.user_id ?? "").trim();
  if (ownerId && ownerId === userId) return true;
  if (record.is_owner === true || record.owner_is_current_user === true) {
    return true;
  }
  return false;
};

export const isOwnedLegacyDeletedBusiness = (
  item: DiscoverableListing,
  context: DisplayableListingContext
): boolean => {
  if (isEventListing(item) || !context.userId) return false;

  const id = getListingId(item);
  if (!id) return false;

  const record = item as Record<string, unknown>;
  if (!isRecordOwnedByCurrentUser(record, context.userId)) return false;

  return (
    !context.profileStorageIds.has(id) && !context.ownedIds.has(id)
  );
};

export const isDisplayableDiscoverableListing = (
  item: DiscoverableListing,
  context: DisplayableListingContext
): boolean => {
  if (isEventListing(item)) {
    const id = getListingId(item);
    return Boolean(id);
  }

  const id = getListingId(item);
  if (!id || isDeletedBusinessId(id, context.deletedIds)) {
    return false;
  }

  const record = item as Record<string, unknown>;
  if (isDeletedBusinessRecord(record)) {
    return false;
  }

  if (!getDiscoverableListingTitle(item)) {
    return false;
  }

  if (isOwnedLegacyDeletedBusiness(item, context)) {
    return false;
  }

  const hasLocation =
    Boolean(String(item.city || "").trim()) ||
    Boolean(String(item.address || "").trim()) ||
    Boolean(String(item.street_address || "").trim()) ||
    getMapLat(item) != null;

  return hasLocation;
};

export const buildDisplayableListingContext =
  async (): Promise<DisplayableListingContext> => {
    const deletedIds = await loadDeletedBusinessIds();
    const profileStorageIds = new Set<string>();
    let ownedIds = new Set<string>();
    let userId: string | null = null;

    try {
      const keys = await AsyncStorage.getAllKeys();
      keys
        .filter((key) => key.startsWith("profile_v2_"))
        .forEach((key) => {
          const id = key.slice("profile_v2_".length).trim();
          if (id) profileStorageIds.add(id);
        });
    } catch {
      // Best-effort profile index.
    }

    try {
      const { getActiveUserId, loadUserBusinesses } = await import(
        "./userSessionStorage"
      );
      userId = await getActiveUserId();
      if (userId) {
        const owned = await loadUserBusinesses(userId);
        ownedIds = new Set(
          owned
            .map((row) => String((row as { id?: unknown }).id || "").trim())
            .filter(Boolean)
        );
      }
    } catch {
      // Best-effort owned index.
    }

    const context = {
      deletedIds,
      ownedIds,
      profileStorageIds,
      userId,
    };
    logDiscoverContextStage("4_buildDisplayableListingContext", context);
    return context;
  };

export const filterDisplayableDiscoverableListings = async (
  items: DiscoverableListing[]
): Promise<DiscoverableListing[]> => {
  const context = await buildDisplayableListingContext();
  const legacyDeletedIds: string[] = [];

  const filtered = items.filter((item) => {
    if (!isDisplayableDiscoverableListing(item, context)) {
      if (isOwnedLegacyDeletedBusiness(item, context)) {
        legacyDeletedIds.push(getListingId(item));
      }
      return false;
    }
    return true;
  });

  if (legacyDeletedIds.length > 0) {
    await Promise.all(
      legacyDeletedIds.map((id) => markBusinessDeleted(id))
    );
  }

  return filtered;
};

/** Local/profile rows may only augment API businesses or owned pending-sync rows. */
export const filterLocalDiscoveryCandidates = (
  apiListings: DiscoverableListing[],
  candidates: DiscoverableListing[],
  context: DisplayableListingContext,
  traceSource = "unknown"
): DiscoverableListing[] => {
  const apiBusinessIds = new Set(
    apiListings
      .filter((item) => !isEventListing(item))
      .map(getListingId)
      .filter(Boolean)
  );

  const result = candidates.filter((item) => {
    if (isEventListing(item)) {
      return isDisplayableDiscoverableListing(item, context);
    }

    const id = getListingId(item);
    if (!id || isDeletedBusinessId(id, context.deletedIds)) {
      return false;
    }

    if (apiBusinessIds.has(id)) {
      return isDisplayableDiscoverableListing(item, context);
    }

    if (
      context.ownedIds.has(id) &&
      context.profileStorageIds.has(id) &&
      isDisplayableDiscoverableListing(item, context)
    ) {
      return true;
    }

    return false;
  });

  logDiscoverListStage(`3_filterLocalDiscoveryCandidates:${traceSource}`, result, {
    inputCandidateCount: candidates.length,
    inputCandidateBusinessIds: businessIdsFrom(candidates),
    apiBusinessIds: [...apiBusinessIds],
  });

  return result;
};

/**
 * Remove orphaned profile_v2 rows (e.g. production leftovers on staging).
 * Runs on dev/staging API environments only unless forced.
 */
export const pruneOrphanedLocalBusinessProfiles = async (
  apiListings: DiscoverableListing[]
): Promise<number> => {
  const { isNonProductionApi } = await import("./apiConfig");
  if (!isNonProductionApi()) return 0;

  const context = await buildDisplayableListingContext();
  const apiBusinessIds = new Set(
    apiListings
      .filter((item) => !isEventListing(item))
      .map(getListingId)
      .filter(Boolean)
  );

  let pruned = 0;

  for (const id of context.profileStorageIds) {
    if (isDeletedBusinessId(id, context.deletedIds)) {
      await purgeBusinessFromClientCaches(id);
      pruned += 1;
      continue;
    }

    if (!apiBusinessIds.has(id) && !context.ownedIds.has(id)) {
      await purgeBusinessFromClientCaches(id);
      pruned += 1;
    }
  }

  return pruned;
};

export const isDisplayableBusinessRecord = (
  business: Record<string, unknown> | null | undefined,
  deletedIds?: Set<string>
): boolean => {
  if (!business) return false;

  const id = String(business.id || "").trim();
  if (!id) return false;
  if (deletedIds && isDeletedBusinessId(id, deletedIds)) return false;
  if (isDeletedBusinessRecord(business)) return false;

  const title = String(
    business.business_name || business.name || business.title || ""
  ).trim();

  return Boolean(title);
};

export const purgeBusinessFromClientCaches = async (
  businessId: string
): Promise<void> => {
  const id = String(businessId || "").trim();
  if (!id) return;

  await markBusinessDeleted(id);
  removeBusinessFromDiscoverCache(id);

  try {
    await AsyncStorage.removeItem(`profile_v2_${id}`);
    await AsyncStorage.removeItem(`business_reviews_${id}`);
  } catch {
    // Best-effort local profile cleanup.
  }

  try {
    const { getActiveUserId, loadUserBusinesses, saveUserBusinesses } =
      await import("./userSessionStorage");
    const userId = await getActiveUserId();
    if (userId) {
      const owned = (await loadUserBusinesses(userId)) as Record<
        string,
        unknown
      >[];
      const next = owned.filter((row) => String(row.id || "") !== id);
      if (next.length !== owned.length) {
        await saveUserBusinesses(userId, next);
      }
    }
  } catch {
    // Best-effort owned-list cleanup.
  }

  try {
    const { removeBusinessFavorite } = await import("./businessFavorites");
    await removeBusinessFavorite(id);
  } catch {
    // Best-effort favorites cleanup.
  }

  requestDiscoverListingsRefresh();
};
