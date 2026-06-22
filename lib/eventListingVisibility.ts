import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type DiscoverableListing,
  getListingId,
  isEventListing,
} from "./discoverableListings";
import {
  isDeletedEventId,
  loadDeletedEventIds,
  markEventDeleted,
} from "./deletedEventRegistry";
import { removeEventFromDiscoverCache } from "./discoverListingsCache";
import { requestDiscoverListingsRefresh } from "./discoverListingsRefresh";
import { isUpcomingEvent, type EventMapItem } from "./mapEvents";

const EVENT_SNAPSHOT_PREFIX = "map_event_snapshot_";

const isInactiveEventRecord = (item: Record<string, unknown>) =>
  item.is_active === false ||
  item.is_published === false ||
  item.is_public === false ||
  item.deleted === true ||
  item._deleted === true;

export const isDisplayableEventListing = (
  item: DiscoverableListing,
  deletedIds: Set<string>
): boolean => {
  if (!isEventListing(item)) return true;

  const id = getListingId(item);
  if (!id || isDeletedEventId(id, deletedIds)) {
    return false;
  }

  const record = item as Record<string, unknown>;
  if (isInactiveEventRecord(record)) {
    return false;
  }

  return isUpcomingEvent(item as EventMapItem);
};

export const filterDisplayableEventListings = async (
  items: DiscoverableListing[]
): Promise<DiscoverableListing[]> => {
  const deletedIds = await loadDeletedEventIds();
  return items.filter((item) => isDisplayableEventListing(item, deletedIds));
};

export const purgeEventFromClientCaches = async (
  eventId: string
): Promise<void> => {
  const id = String(eventId || "").trim();
  if (!id) return;

  await markEventDeleted(id);
  removeEventFromDiscoverCache(id);

  try {
    await AsyncStorage.removeItem(`${EVENT_SNAPSHOT_PREFIX}${id}`);
  } catch {
    // Best-effort snapshot cleanup.
  }

  try {
    const { removeInterestedEvent } = await import("./mapEventDetails");
    await removeInterestedEvent(id);
  } catch {
    // Best-effort interested-event cleanup.
  }

  requestDiscoverListingsRefresh();
};

/** Remove snapshot rows for tombstoned or missing community events. */
export const pruneStaleEventSnapshots = async (): Promise<number> => {
  const deletedIds = await loadDeletedEventIds();
  const keys = await AsyncStorage.getAllKeys();
  const snapshotKeys = keys.filter((key) =>
    key.startsWith(EVENT_SNAPSHOT_PREFIX)
  );

  if (!snapshotKeys.length) return 0;

  let validIds = new Set<string>();
  try {
    const { readCommunityEventIds } = await import("./communityEvents");
    validIds = await readCommunityEventIds();
  } catch {
    validIds = new Set();
  }

  const staleKeys = snapshotKeys.filter((key) => {
    const id = key.slice(EVENT_SNAPSHOT_PREFIX.length);
    if (!id) return true;
    if (isDeletedEventId(id, deletedIds)) return true;
    return !validIds.has(id);
  });

  if (staleKeys.length) {
    await AsyncStorage.multiRemove(staleKeys);
  }

  return staleKeys.length;
};
