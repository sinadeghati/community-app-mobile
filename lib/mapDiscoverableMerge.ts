import type { DiscoverableListing } from "./discoverableListings";
import { getListingId } from "./discoverableListings";

export const mergeDiscoverableListingsById = <T extends DiscoverableListing>(
  previous: T[],
  incoming: T[]
): T[] => {
  const byId = new Map<string, T>();

  previous.forEach((item) => {
    const id = getListingId(item);
    if (id) byId.set(id, item);
  });

  incoming.forEach((item) => {
    const id = getListingId(item);
    if (!id) return;
    const existing = byId.get(id);
    byId.set(id, existing ? { ...existing, ...item } : item);
  });

  return Array.from(byId.values());
};
