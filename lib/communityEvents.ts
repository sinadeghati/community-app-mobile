import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiscoverableListing } from "./discoverableListings";
import {
  isDeletedEventId,
  loadDeletedEventIds,
} from "./deletedEventRegistry";
import {
  requestDiscoverListingsRefresh,
  requestMyEventsRefresh,
} from "./discoverListingsRefresh";
import { purgeEventFromClientCaches } from "./eventListingVisibility";
import { logDiscoverPipeline, logEventSaved } from "./eventDiagnostics";
import { syncEventScheduleFields } from "./eventDateTime";
import { formatEventAddress } from "./eventLocation";
import {
  getEventScheduleIso,
  isUpcomingEvent,
  parseEventDate,
  type EventMapItem,
} from "./mapEvents";
import { getActiveUserId } from "./userSessionStorage";
import type {
  CommunityEvent,
  CommunityEventInput,
  CommunityEventSaveResult,
} from "./communityEventTypes";
import {
  buildServerEventPayload,
  formatServerEventApiError,
  hasDisplayableServerEvent,
  mapApiEventToCommunityEvent,
  validateCommunityEventInput,
} from "./serverEvents";
import { isServerEventId } from "./serverEventIds";

export type { CommunityEvent, CommunityEventInput, CommunityEventSaveResult } from "./communityEventTypes";

const LEGACY_STORAGE_KEY = "community_events_v1";
const LEGACY_RETIRED_KEY = "community_events_legacy_retired_v2";

let legacyRetireInflight: Promise<void> | null = null;

export const retireLegacyCommunityEventsStorage = async (): Promise<void> => {
  if (!legacyRetireInflight) {
    legacyRetireInflight = (async () => {
      const done = await AsyncStorage.getItem(LEGACY_RETIRED_KEY);
      if (done === "1") return;
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      await AsyncStorage.setItem(LEGACY_RETIRED_KEY, "1");
    })().finally(() => {
      legacyRetireInflight = null;
    });
  }
  await legacyRetireInflight;
};

const normalizeEventRecord = (
  event: CommunityEvent
): CommunityEvent & DiscoverableListing => {
  const scheduleFields = syncEventScheduleFields(getEventScheduleIso(event));

  return {
    ...event,
    ...scheduleFields,
    id: String(event.id),
    title: event.title,
    name: event.title,
    business_name: event.title,
    category: event.category || "Event",
    business_category: event.business_category || event.category || "Event",
    description: event.description || event.about || "",
    about: event.about || event.description || "",
    address:
      event.address ||
      formatEventAddress({
        streetAddress: event.street_address,
        city: event.city,
        state: event.state,
        zipCode: event.zip_code,
        country: event.country,
      }) ||
      event.location ||
      "",
    street_address: event.street_address,
    zip_code: event.zip_code,
    country: event.country || "United States",
    image: event.image || event.cover_image || event.image_url,
    cover_image: event.cover_image || event.image || event.image_url,
    image_url: event.image_url || event.cover_image || event.image,
    coordinates_exact: event.coordinates_exact === true,
    latitude: event.coordinates_exact ? event.latitude : undefined,
    longitude: event.coordinates_exact ? event.longitude : undefined,
    lat: event.coordinates_exact ? event.latitude : undefined,
    lng: event.coordinates_exact ? event.longitude : undefined,
    is_public: event.is_public !== false,
    is_active: (event as Record<string, unknown>).is_active !== false,
    is_published: event.is_published !== false,
  };
};

export const readCommunityEventIds = async (): Promise<Set<string>> => {
  const events = await fetchPublicEventsFromApi();
  return new Set(events.map((event) => String(event.id || "").trim()).filter(Boolean));
};

export const createEventId = (kind?: "festival" | "event") =>
  kind === "festival" ? `festival-${Date.now()}` : `event-${Date.now()}`;

export { parseEventDateTime } from "./eventDateTime";

export const parseLocationFields = (location: string) => {
  const trimmed = location.trim();
  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const state = parts[parts.length - 1];
    const city = parts[parts.length - 2] || parts[0];
    return {
      address: trimmed,
      city,
      state,
    };
  }

  return {
    address: trimmed,
    city: trimmed || "San Diego",
    state: "CA",
  };
};

export const listPublicCommunityEvents = async (): Promise<CommunityEvent[]> => {
  const events = await fetchPublicEventsFromApi();
  logDiscoverPipeline("api-public", events);
  const upcoming = events
    .filter((event) => event.is_public !== false)
    .filter(hasDisplayableServerEvent)
    .map(normalizeEventRecord)
    .filter((event) => isUpcomingEvent(event));
  logDiscoverPipeline("normalized", upcoming);
  return upcoming;
};

export const countCommunityEventsForOwner = async (
  ownerId: string
): Promise<number> => {
  if (!ownerId) return 0;
  const events = await listCommunityEventsForOwner(ownerId);
  return events.length;
};

export const listCommunityEventsForOwner = async (
  ownerId: string
): Promise<CommunityEvent[]> => {
  if (!ownerId) return [];
  try {
    const { API } = await import("./api");
    const response = await API.getMyEvents();
    const list = Array.isArray(response) ? response : [];
    return list
      .map((row) => normalizeEventRecord(mapApiEventToCommunityEvent(row)))
      .filter((event) => String(event.owner_id) === String(ownerId))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  } catch (error) {
    console.log("[events] mine list failed", error);
    return [];
  }
};

export const getCommunityEventById = async (
  eventId: string
): Promise<CommunityEvent | null> => {
  if (!eventId) return null;

  const deletedIds = await loadDeletedEventIds();
  if (isDeletedEventId(eventId, deletedIds)) {
    return null;
  }

  if (!isServerEventId(eventId)) {
    return null;
  }

  try {
    const { API } = await import("./api");
    const row = await API.getEvent(eventId);
    return normalizeEventRecord(mapApiEventToCommunityEvent(row));
  } catch (error) {
    console.log("[events] detail fetch failed", error);
    return null;
  }
};

export const isCommunityEventOwner = async (
  event: { owner_id?: string | number | null } | null,
  userId?: string | null
) => {
  if (!event || !userId) return false;
  const ownerId = event.owner_id;
  if (ownerId == null || ownerId === "") return false;
  return String(ownerId) === String(userId);
};

export const saveCommunityEvent = async (
  input: CommunityEventInput,
  options?: { eventId?: string; ownerId?: string; organizer?: string }
): Promise<CommunityEventSaveResult> => {
  const ownerId = options?.ownerId || (await getActiveUserId());
  if (!ownerId) {
    return { ok: false, message: "Please log in to create events." };
  }

  const validation = validateCommunityEventInput(input);
  if (!validation.ok) {
    return validation;
  }

  const payload = buildServerEventPayload(input, {
    organizer: options?.organizer,
  });

  const eventId = options?.eventId?.trim();
  const isUpdate = Boolean(eventId && isServerEventId(eventId));

  try {
    const { API } = await import("./api");
    const row = isUpdate
      ? await API.updateEvent(eventId!, payload)
      : await API.createEvent(payload);
    const normalized = normalizeEventRecord(mapApiEventToCommunityEvent(row));
    logEventSaved(normalized);
    const { saveMapEventSnapshot } = await import("./mapEventDetails");
    await saveMapEventSnapshot(normalized);
    requestDiscoverListingsRefresh();
    requestMyEventsRefresh();
    return { ok: true, event: normalized };
  } catch (error) {
    console.log("[events] API save failed", error);
    return { ok: false, message: formatServerEventApiError(error) };
  }
};

export const deleteCommunityEvent = async (
  eventId: string,
  ownerId?: string
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const resolvedOwnerId = ownerId || (await getActiveUserId());
  if (!resolvedOwnerId) {
    return { ok: false, message: "Please log in to delete events." };
  }

  if (!isServerEventId(eventId)) {
    return { ok: false, message: "Event not found." };
  }

  try {
    const existing = await getCommunityEventById(eventId);
    if (!existing) {
      return { ok: false, message: "Event not found." };
    }
    if (String(existing.owner_id) !== String(resolvedOwnerId)) {
      return { ok: false, message: "You can only delete events you created." };
    }

    const { API } = await import("./api");
    await API.deleteEvent(eventId);
    await purgeEventFromClientCaches(eventId);
    requestDiscoverListingsRefresh();
    requestMyEventsRefresh();
    return { ok: true };
  } catch (error) {
    console.log("[events] API delete failed", error);
    return { ok: false, message: formatServerEventApiError(error) };
  }
};

const fetchPublicEventsFromApi = async (): Promise<CommunityEvent[]> => {
  await retireLegacyCommunityEventsStorage();
  try {
    const { API } = await import("./api");
    const response = await API.getEvents();
    const list = Array.isArray(response)
      ? response
      : (response as { results?: CommunityEvent[] })?.results || [];

    return list
      .map((row) => mapApiEventToCommunityEvent(row as Record<string, unknown>))
      .filter(hasDisplayableServerEvent);
  } catch (error) {
    console.log("[events] public list failed", error);
    return [];
  }
};

export const loadCommunityEventsForDiscover = async (): Promise<
  DiscoverableListing[]
> => {
  const deletedIds = await loadDeletedEventIds();
  const apiEvents = await fetchPublicEventsFromApi();
  const normalized = apiEvents
    .map(normalizeEventRecord)
    .filter((event) => !isDeletedEventId(String(event.id), deletedIds))
    .filter((event) => isUpcomingEvent(event));

  return normalized as DiscoverableListing[];
};
