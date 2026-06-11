import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import { notifyFavoritesChanged } from "./favoritesRefresh";
import { getActiveUserId } from "./userSessionStorage";
import {
  getMapLat,
  getMapLng,
  isPlaceholderCoordinate,
  resolveMapPoints,
  shouldUseExactCoordinates,
} from "./mapCoordinates";
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

export const getEventAddressQuery = (event: EventMapItem) => {
  const formatted = formatEventLocation(event);
  if (formatted) return formatted;

  const location = String(event.location || "").trim();
  if (location) return location;

  return "";
};

export const getEventMapPoint = (event: EventMapItem) => {
  const lat = getMapLat(event);
  const lng = getMapLng(event);

  if (
    lat != null &&
    lng != null &&
    shouldUseExactCoordinates(event, lat, lng)
  ) {
    return { latitude: lat, longitude: lng };
  }

  const resolved = resolveMapPoints([event])[0];
  if (!resolved) return null;

  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
  };
};

export const getEventDirectionsQuery = (event: EventMapItem): string | null => {
  const coordinatesExact =
    (event as Record<string, unknown>).coordinates_exact === true;
  const lat = getMapLat(event);
  const lng = getMapLng(event);

  if (coordinatesExact && lat != null && lng != null) {
    return `${lat},${lng}`;
  }

  const addressQuery = getEventAddressQuery(event);
  if (addressQuery) return addressQuery;

  return null;
};

export const openEventDirections = async (event: EventMapItem) => {
  const query = getEventDirectionsQuery(event);
  if (!query) return false;

  const label = encodeURIComponent(getEventTitle(event));
  const encodedQuery = encodeURIComponent(query);
  const isCoordinatePair = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query);

  const googleUrl = isCoordinatePair
    ? `https://www.google.com/maps/search/?api=1&query=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  if (Platform.OS === "ios") {
    const appleUrl = isCoordinatePair
      ? `http://maps.apple.com/?ll=${query}&q=${label}`
      : `http://maps.apple.com/?q=${encodedQuery}`;

    const canOpenApple = await Linking.canOpenURL(appleUrl);
    if (canOpenApple) {
      await Linking.openURL(appleUrl);
      return true;
    }
  }

  await Linking.openURL(googleUrl);
  return true;
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
  if (!(await getActiveUserId())) return [];
  return readInterestedEventIds();
};

export const countInterestedEvents = async (): Promise<number> => {
  const events = await loadInterestedEvents();
  return events.length;
};

export const isEventSaved = async (eventId: string) => {
  if (!eventId || !(await getActiveUserId())) return false;
  const ids = await readInterestedEventIds();
  return ids.includes(String(eventId));
};

export const toggleEventSaved = async (eventId: string) => {
  if (!(await getActiveUserId())) {
    return false;
  }

  const normalizedId = String(eventId);
  const ids = await readInterestedEventIds();
  const next = ids.includes(normalizedId)
    ? ids.filter((id) => id !== normalizedId)
    : [...ids, normalizedId];

  await AsyncStorage.setItem(INTERESTED_EVENTS_KEY, JSON.stringify(next));
  notifyFavoritesChanged();
  return !ids.includes(normalizedId);
};

export const removeInterestedEvent = async (eventId: string) => {
  const ids = await readInterestedEventIds();
  const next = ids.filter((id) => id !== eventId);
  await AsyncStorage.setItem(INTERESTED_EVENTS_KEY, JSON.stringify(next));
  notifyFavoritesChanged();
};

const readInterestedEventSnapshots = async (
  ids: string[]
): Promise<EventMapItem[]> => {
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

/** Reads cached event snapshots without auth or network. */
export const loadInterestedEventsFromStorage =
  async (): Promise<EventMapItem[]> => {
    const ids = await readInterestedEventIds();
    return readInterestedEventSnapshots(ids);
  };

export const loadInterestedEvents = async (): Promise<EventMapItem[]> => {
  const ids = await loadInterestedEventIds();
  if (!ids.length) return [];

  const byId = new Map(
    (await readInterestedEventSnapshots(ids)).map((event) => [
      getEventId(event),
      event,
    ])
  );

  const { getCommunityEventById } = await import("./communityEvents");

  const resolved = await Promise.all(
    ids.map(async (id) => {
      const cached = byId.get(id);
      if (cached) return cached;

      const event = await getCommunityEventById(id);
      if (!event) return null;

      await saveMapEventSnapshot(event);
      return event;
    })
  );

  return resolved.filter((event): event is EventMapItem => Boolean(event));
};

export { formatEventDateTime, formatEventLocation };
export type { EventMapItem } from "./mapEvents";
