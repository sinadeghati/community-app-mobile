import type { DiscoverableListing } from "./discoverableListings";

let memoryCache: DiscoverableListing[] | null = null;

export const getCachedDiscoverListings = (): DiscoverableListing[] | null =>
  memoryCache;

export const setCachedDiscoverListings = (
  listings: DiscoverableListing[]
): void => {
  memoryCache = listings;
};

/** Drop tombstoned/invalid rows from the in-memory discover cache. */
export const sanitizeCachedDiscoverListings = async (): Promise<
  DiscoverableListing[]
> => {
  if (!memoryCache?.length) return [];

  const { filterDisplayableDiscoverableListings } = await import(
    "./businessListingVisibility"
  );
  const { filterDisplayableEventListings } = await import(
    "./eventListingVisibility"
  );

  const businessFiltered = await filterDisplayableDiscoverableListings(
    memoryCache
  );
  const filtered = await filterDisplayableEventListings(businessFiltered);
  memoryCache = filtered;
  return filtered;
};

export const removeBusinessFromDiscoverCache = (businessId: string): void => {
  const id = String(businessId || "").trim();
  if (!id || !memoryCache) return;

  memoryCache = memoryCache.filter(
    (item) => String((item as { id?: unknown }).id ?? "") !== id
  );
};

export const removeEventFromDiscoverCache = (eventId: string): void => {
  const id = String(eventId || "").trim();
  if (!id || !memoryCache) return;

  memoryCache = memoryCache.filter(
    (item) => String((item as { id?: unknown }).id ?? "") !== id
  );
};

export const clearDiscoverListingsCache = (): void => {
  memoryCache = null;
};

export const hasCachedDiscoverListings = (): boolean =>
  Boolean(memoryCache && memoryCache.length > 0);
