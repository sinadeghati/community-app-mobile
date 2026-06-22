import { isNonProductionApi } from "./apiConfig";
import { clearDeletedBusinessRegistry } from "./deletedBusinessRegistry";
import { pruneOrphanedLocalBusinessProfiles } from "./businessListingVisibility";
import { pruneStaleEventSnapshots } from "./eventListingVisibility";
import { clearDiscoverListingsCache } from "./discoverListingsCache";
import { loadDiscoverableListings } from "./discoverableListings";
import { requestDiscoverListingsRefresh } from "./discoverListingsRefresh";
import { API } from "./api";
import type { DiscoverableListing } from "./discoverableListings";

export type DiscoverCleanupResult = {
  skipped: boolean;
  reason?: string;
  prunedProfiles?: number;
  prunedEventSnapshots?: number;
  listingCount?: number;
  clearedTombstones?: boolean;
};

let ranThisSession = false;

const loadApiBusinessListings = async (): Promise<DiscoverableListing[]> => {
  try {
    const response = await API.getListings();
    return Array.isArray(response)
      ? response
      : response?.results || [];
  } catch {
    return [];
  }
};

/**
 * Dev/staging-only discover cache cleanup.
 * Clears in-memory discover cache, prunes orphaned local profiles, refetches API.
 * Does not touch production Railway data.
 */
export const runDevStagingDiscoverCleanup = async (options?: {
  force?: boolean;
  clearTombstones?: boolean;
}): Promise<DiscoverCleanupResult> => {
  if (!isNonProductionApi()) {
    return { skipped: true, reason: "production_api" };
  }

  if (ranThisSession && !options?.force) {
    return { skipped: true, reason: "already_ran_this_session" };
  }

  ranThisSession = true;

  if (options?.clearTombstones) {
    await clearDeletedBusinessRegistry();
  }

  clearDiscoverListingsCache();

  const apiListings = await loadApiBusinessListings();
  const prunedProfiles = await pruneOrphanedLocalBusinessProfiles(apiListings);
  const prunedEventSnapshots = await pruneStaleEventSnapshots();

  const listings = await loadDiscoverableListings();
  requestDiscoverListingsRefresh();

  return {
    skipped: false,
    prunedProfiles,
    prunedEventSnapshots,
    listingCount: listings.length,
    clearedTombstones: Boolean(options?.clearTombstones),
  };
};
