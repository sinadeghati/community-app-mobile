import AsyncStorage from "@react-native-async-storage/async-storage";
import { isUserLoggedIn } from "./businessReviews";
import { getMapLat, getMapLng, resolveMapPoints } from "./mapCoordinates";
import {
  formatEventDateTime,
  formatEventLocation,
  type EventMapItem,
} from "./mapEvents";

const EVENT_SNAPSHOT_PREFIX = "map_event_snapshot_";

export const EVENT_FALLBACK_COVER =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1600";

export const getEventId = (event?: EventMapItem | null) =>
  String(event?.id || "");

export const getEventTitle = (event?: EventMapItem | null) =>
  event?.title || event?.name || event?.business_name || "Community Event";

export const getEventCategory = (event?: EventMapItem | null) =>
  event?.business_category || event?.category || "Event";

export const getEventCover = (event?: EventMapItem | null) =>
  event?.cover_image || event?.image_url || event?.image || EVENT_FALLBACK_COVER;

export const getEventDescription = (event?: EventMapItem | null) => {
  const text = String(event?.description || event?.about || "").trim();
  return (
    text ||
    "Join the Persian community for this local gathering. More details will be posted soon."
  );
};

export const getEventOrganizer = (event?: EventMapItem | null) => {
  const organizer = String(
    (event as Record<string, unknown>)?.organizer ||
      (event as Record<string, unknown>)?.organizer_name ||
      event?.business_name ||
      (event as Record<string, unknown>)?.businessName ||
      ""
  ).trim();

  return organizer || null;
};

export const getEventTicketUrl = (event?: EventMapItem | null): string | null => {
  const candidates = [
    (event as Record<string, unknown>)?.ticket_url,
    (event as Record<string, unknown>)?.tickets_url,
    (event as Record<string, unknown>)?.ticketUrl,
    event?.website,
  ];

  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (!value) continue;
    if (/^https?:\/\//i.test(value)) return value;
  }

  return null;
};

export const getEventMapPoint = (event: EventMapItem) => {
  const lat = getMapLat(event);
  const lng = getMapLng(event);

  if (lat != null && lng != null) {
    return { latitude: lat, longitude: lng };
  }

  const resolved = resolveMapPoints([event])[0];
  if (!resolved) return null;

  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
  };
};

export const saveMapEventSnapshot = async (event: EventMapItem) => {
  const id = getEventId(event);
  if (!id) return;

  await AsyncStorage.setItem(
    `${EVENT_SNAPSHOT_PREFIX}${id}`,
    JSON.stringify(event)
  );
};

export const loadMapEventSnapshot = async (
  eventId: string
): Promise<EventMapItem | null> => {
  if (!eventId) return null;

  try {
    const raw = await AsyncStorage.getItem(`${EVENT_SNAPSHOT_PREFIX}${eventId}`);
    if (!raw) return null;
    return JSON.parse(raw) as EventMapItem;
  } catch {
    return null;
  }
};

export const INTERESTED_EVENTS_KEY = "saved_map_events";

const readInterestedEventIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(INTERESTED_EVENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
};

export const loadInterestedEventIds = async (): Promise<string[]> => {
  if (!(await isUserLoggedIn())) return [];
  return readInterestedEventIds();
};

export const isEventSaved = async (eventId: string) => {
  if (!eventId || !(await isUserLoggedIn())) return false;
  const ids = await readInterestedEventIds();
  return ids.includes(eventId);
};

export const toggleEventSaved = async (eventId: string) => {
  const ids = await readInterestedEventIds();
  const next = ids.includes(eventId)
    ? ids.filter((id) => id !== eventId)
    : [...ids, eventId];

  await AsyncStorage.setItem(INTERESTED_EVENTS_KEY, JSON.stringify(next));
  return !ids.includes(eventId);
};

export const removeInterestedEvent = async (eventId: string) => {
  const ids = await readInterestedEventIds();
  const next = ids.filter((id) => id !== eventId);
  await AsyncStorage.setItem(INTERESTED_EVENTS_KEY, JSON.stringify(next));
};

export const loadInterestedEvents = async (): Promise<EventMapItem[]> => {
  const ids = await loadInterestedEventIds();
  if (!ids.length) return [];

  const pairs = await AsyncStorage.multiGet(
    ids.map((id) => `${EVENT_SNAPSHOT_PREFIX}${id}`)
  );

  const byId = new Map<string, EventMapItem>();
  pairs.forEach(([key, value]) => {
    if (!value) return;
    try {
      const event = JSON.parse(value) as EventMapItem;
      const id = key.replace(EVENT_SNAPSHOT_PREFIX, "");
      byId.set(id, event);
    } catch {
      /* skip */
    }
  });

  return ids
    .map((id) => byId.get(id))
    .filter((event): event is EventMapItem => Boolean(event));
};

export { formatEventDateTime, formatEventLocation };
export type { EventMapItem } from "./mapEvents";
