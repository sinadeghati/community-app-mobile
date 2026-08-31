import { isDeletedEventId } from "./deletedEventRegistry";
import type { DiscoverableListing } from "./discoverableListings";

type CommunityEventMergeRecord = DiscoverableListing & {
  updated_at?: string;
};

/** Merge API + device events so locally created events still appear on Map when the API list is non-empty. */
export const mergeCommunityEventsForDiscover = (
  apiEvents: DiscoverableListing[],
  localEvents: DiscoverableListing[],
  deletedIds: Set<string>
): DiscoverableListing[] => {
  const byId = new Map<string, DiscoverableListing>();

  for (const event of apiEvents) {
    const id = String(event.id || "").trim();
    if (!id || isDeletedEventId(id, deletedIds)) continue;
    byId.set(id, event);
  }

  for (const event of localEvents) {
    const id = String(event.id || "").trim();
    if (!id || isDeletedEventId(id, deletedIds)) continue;

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, event);
      continue;
    }

    const localUpdated = new Date(
      String((event as CommunityEventMergeRecord).updated_at || 0)
    ).getTime();
    const apiUpdated = new Date(
      String((existing as CommunityEventMergeRecord).updated_at || 0)
    ).getTime();
    byId.set(id, localUpdated >= apiUpdated ? event : existing);
  }

  return Array.from(byId.values());
};
