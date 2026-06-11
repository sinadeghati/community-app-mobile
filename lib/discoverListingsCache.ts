import type { DiscoverableListing } from "./discoverableListings";

let memoryCache: DiscoverableListing[] | null = null;

export const getCachedDiscoverListings = (): DiscoverableListing[] | null =>
  memoryCache;

export const setCachedDiscoverListings = (
  listings: DiscoverableListing[]
): void => {
  memoryCache = listings;
};

export const hasCachedDiscoverListings = (): boolean =>
  Boolean(memoryCache && memoryCache.length > 0);
