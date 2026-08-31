import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiscoverableListing } from "./discoverableListings";
import {
  isDeletedEventId,
  loadDeletedEventIds,
} from "./deletedEventRegistry";
import { mergeCommunityEventsForDiscover } from "./communityEventsDiscoverMerge";
import { requestDiscoverListingsRefresh } from "./discoverListingsRefresh";
import { purgeEventFromClientCaches } from "./eventListingVisibility";
import { logDiscoverPipeline, logEventSaved } from "./eventDiagnostics";
import { resolveEventDateTimeIso, resolveEventEndDateTimeIso, syncEventEndScheduleFields, syncEventScheduleFields } from "./eventDateTime";
import {
  formatEventAddress,
  hasMinimumEventAddress,
  isValidEventZipCode,
} from "./eventLocation";
import { normalizeTicketUrl } from "./eventTickets";
import {
  getEventScheduleIso,
  isUpcomingEvent,
  parseEventDate,
  type EventMapItem,
} from "./mapEvents";
import { getActiveUserId } from "./userSessionStorage";

const STORAGE_KEY = "community_events_v1";

export type CommunityEventInput = {
  title: string;
  description?: string;
  location?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  date?: string;
  time?: string;
  eventDateIso?: string;
  endDate?: string;
  endTime?: string;
  endDateIso?: string;
  ticketUrl?: string;
  businessId?: string;
  category?: string;
  isPublic?: boolean;
  image?: string;
  cover_image?: string;
};

export type CommunityEvent = EventMapItem & {
  id: string;
  title: string;
  description?: string;
  about?: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  location?: string;
  event_date: string;
  category: string;
  business_category: string;
  owner_id: string;
  business_id?: string;
  organizer?: string;
  ticket_url?: string;
  is_public: boolean;
  is_active?: boolean;
  is_published?: boolean;
  coordinates_exact?: boolean;
  latitude?: number;
  longitude?: number;
  image?: string;
  cover_image?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
};

export type CommunityEventSaveResult =
  | { ok: true; event: CommunityEvent; apiSynced: boolean }
  | { ok: false; message: string };

const readAllEvents = async (): Promise<CommunityEvent[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CommunityEvent[]) : [];
  } catch {
    return [];
  }
};

export const readCommunityEventIds = async (): Promise<Set<string>> => {
  const events = await readAllEvents();
  return new Set(events.map((event) => String(event.id || "").trim()).filter(Boolean));
};

const readActiveEvents = async (): Promise<CommunityEvent[]> => {
  const deletedIds = await loadDeletedEventIds();
  const events = await readAllEvents();
  return events.filter((event) => !isDeletedEventId(String(event.id || ""), deletedIds));
};

const writeAllEvents = async (events: CommunityEvent[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
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
    is_published: (event as Record<string, unknown>).is_published !== false,
  };
};

const hasEventLocation = (event: CommunityEvent) =>
  Boolean(
    String(
      event.location ||
        event.address ||
        event.street_address ||
        event.city ||
        ""
    ).trim()
  );

const hasEventSchedule = (event: CommunityEvent) =>
  Boolean(parseEventDate(event));

export const listPublicCommunityEvents = async (): Promise<CommunityEvent[]> => {
  const events = await readActiveEvents();
  logDiscoverPipeline("storage", events);

  const publicEvents = events.filter((event) => event.is_public !== false);
  logDiscoverPipeline("public", publicEvents);

  const withLocation = publicEvents.filter(hasEventLocation);
  logDiscoverPipeline("with-location", withLocation, {
    dropped: publicEvents
      .filter((event) => !hasEventLocation(event))
      .map((event) => event.id),
  });

  const withSchedule = withLocation.filter(hasEventSchedule);
  logDiscoverPipeline("with-schedule", withSchedule, {
    dropped: withLocation
      .filter((event) => !hasEventSchedule(event))
      .map((event) => event.id),
  });

  const normalized = withSchedule
    .map(normalizeEventRecord)
    .filter((event) => isUpcomingEvent(event));
  logDiscoverPipeline("normalized", normalized);
  return normalized;
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
  const events = await readActiveEvents();
  return events
    .filter((event) => String(event.owner_id) === String(ownerId))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .map(normalizeEventRecord);
};

export const getCommunityEventById = async (
  eventId: string
): Promise<CommunityEvent | null> => {
  if (!eventId) return null;

  const deletedIds = await loadDeletedEventIds();
  if (isDeletedEventId(eventId, deletedIds)) {
    return null;
  }

  const events = await readActiveEvents();
  const found = events.find((event) => String(event.id) === String(eventId));
  return found ? normalizeEventRecord(found) : null;
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

const trySyncEventToApi = async (
  event: CommunityEvent,
  mode: "create" | "update" | "delete"
): Promise<boolean> => {
  try {
    const { API } = await import("./api");
    if (mode === "create") {
      await API.createEvent(event);
      return true;
    }
    if (mode === "update") {
      await API.updateEvent(event.id, event);
      return true;
    }
    await API.deleteEvent(event.id);
    return true;
  } catch (error) {
    console.log(`[events] API ${mode} failed — using local storage`, error);
    return false;
  }
};

export const saveCommunityEvent = async (
  input: CommunityEventInput,
  options?: { eventId?: string; ownerId?: string; organizer?: string }
): Promise<CommunityEventSaveResult> => {
  const ownerId = options?.ownerId || (await getActiveUserId());
  if (!ownerId) {
    return { ok: false, message: "Please log in to create events." };
  }

  const title = input.title.trim();
  const streetAddress = input.streetAddress?.trim() || "";
  const city = input.city?.trim() || "";
  const state = input.state?.trim().toUpperCase() || "";
  const zipCode = input.zipCode?.trim() || "";
  const country = input.country?.trim() || "United States";
  const location =
    input.location?.trim() ||
    formatEventAddress({ streetAddress, city, state, zipCode, country });

  if (!title) {
    return { ok: false, message: "Event title is required." };
  }

  if (!hasMinimumEventAddress({ city, state })) {
    return {
      ok: false,
      message: "Event location is required. Enter city and state.",
    };
  }

  if (!location.trim()) {
    return { ok: false, message: "Event location is required." };
  }

  if (zipCode && !isValidEventZipCode(zipCode)) {
    return { ok: false, message: "Please enter a valid ZIP code." };
  }

  const eventDate = resolveEventDateTimeIso({
    eventDateIso: input.eventDateIso,
    date: input.date,
    time: input.time,
  });
  if (!eventDate) {
    return {
      ok: false,
      message: "Please choose a date and time for your event.",
    };
  }

  const endDate = resolveEventEndDateTimeIso({
    endDateIso: input.endDateIso,
    endDate: input.endDate,
    endTime: input.endTime,
  });

  if (endDate) {
    const startMs = new Date(eventDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs < startMs) {
      return {
        ok: false,
        message: "End date and time must be after the start.",
      };
    }
  }

  const ticketUrlRaw = String(input.ticketUrl || "").trim();
  const ticketUrl = ticketUrlRaw ? normalizeTicketUrl(ticketUrlRaw) : null;
  if (ticketUrlRaw && !ticketUrl) {
    return {
      ok: false,
      message: "Please enter a valid ticket URL (https://...).",
    };
  }

  const now = new Date().toISOString();
  const defaultCategory =
    input.category?.trim() ||
    (/\bfestival\b/i.test(title) ? "Festival" : "Community Gathering");
  const category = String(defaultCategory).trim();
  const eventKind = category.toLowerCase().includes("festival")
    ? "festival"
    : "event";
  const eventId =
    options?.eventId ||
    (eventKind === "festival" ? createEventId("festival") : createEventId());
  const address = formatEventAddress({
    streetAddress,
    city,
    state,
    zipCode,
    country,
  });

  const hasExactCoords =
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  const events = await readAllEvents();
  const existingIndex = events.findIndex(
    (event) => String(event.id) === String(eventId)
  );

  if (existingIndex >= 0 && String(events[existingIndex].owner_id) !== ownerId) {
    return { ok: false, message: "You can only edit events you created." };
  }

  const nextEvent: CommunityEvent = {
    ...(existingIndex >= 0 ? events[existingIndex] : {}),
    ...syncEventScheduleFields(eventDate),
    event_date: eventDate,
    id: eventId,
    title,
    name: title,
    business_name: title,
    description: input.description?.trim() || "",
    about: input.description?.trim() || "",
    location,
    address,
    street_address: streetAddress || undefined,
    city,
    state,
    zip_code: zipCode || undefined,
    country,
    category,
    business_category: category,
    owner_id: ownerId,
    business_id: input.businessId || events[existingIndex]?.business_id,
    organizer:
      options && "organizer" in options
        ? options.organizer?.trim() || undefined
        : existingIndex >= 0
          ? events[existingIndex].organizer
          : undefined,
    ticket_url: ticketUrl || undefined,
    ...syncEventEndScheduleFields(endDate),
    is_public: input.isPublic !== false,
    is_active: true,
    is_published: true,
    coordinates_exact: hasExactCoords,
    ...(hasExactCoords
      ? {
          latitude: input.latitude!,
          longitude: input.longitude!,
          lat: input.latitude!,
          lng: input.longitude!,
        }
      : {
          latitude: undefined,
          longitude: undefined,
          lat: undefined,
          lng: undefined,
        }),
    image:
      input.image?.trim() ||
      input.cover_image?.trim() ||
      events[existingIndex]?.image ||
      events[existingIndex]?.cover_image ||
      undefined,
    cover_image:
      input.cover_image?.trim() ||
      input.image?.trim() ||
      events[existingIndex]?.cover_image ||
      events[existingIndex]?.image ||
      undefined,
    image_url:
      input.cover_image?.trim() ||
      input.image?.trim() ||
      events[existingIndex]?.image_url ||
      events[existingIndex]?.cover_image ||
      events[existingIndex]?.image ||
      undefined,
    created_at: events[existingIndex]?.created_at || now,
    updated_at: now,
  };

  const normalized = normalizeEventRecord({
    ...nextEvent,
    event_date: eventDate,
    ...syncEventScheduleFields(eventDate),
  });
  logEventSaved(normalized);
  const apiSynced = await trySyncEventToApi(normalized, existingIndex >= 0 ? "update" : "create");

  if (existingIndex >= 0) {
    events[existingIndex] = normalized;
  } else {
    events.push(normalized);
  }

  try {
    await writeAllEvents(events);
    const { saveMapEventSnapshot } = await import("./mapEventDetails");
    await saveMapEventSnapshot(normalized);
    requestDiscoverListingsRefresh();
    return { ok: true, event: normalized, apiSynced };
  } catch (error) {
    console.log("[events] local save failed", error);
    return {
      ok: false,
      message: "Could not save the event on this device. Please try again.",
    };
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

  const events = await readAllEvents();
  const target = events.find((event) => String(event.id) === String(eventId));
  if (!target) {
    return { ok: false, message: "Event not found." };
  }
  if (String(target.owner_id) !== String(resolvedOwnerId)) {
    return { ok: false, message: "You can only delete events you created." };
  }

  await trySyncEventToApi(target, "delete");

  const nextEvents = events.filter((event) => String(event.id) !== String(eventId));
  await writeAllEvents(nextEvents);
  await purgeEventFromClientCaches(eventId);

  return { ok: true };
};

const fetchCommunityEventsFromApi = async (): Promise<CommunityEvent[]> => {
  try {
    const { API } = await import("./api");
    const response = await API.getEvents();
    const list = Array.isArray(response)
      ? response
      : (response as { results?: CommunityEvent[] })?.results || [];

    return list
      .map((row) => normalizeEventRecord(row as CommunityEvent))
      .filter((event) => hasEventLocation(event) && hasEventSchedule(event));
  } catch {
    return [];
  }
};

export { mergeCommunityEventsForDiscover } from "./communityEventsDiscoverMerge";

export const loadCommunityEventsForDiscover = async (): Promise<
  DiscoverableListing[]
> => {
  const deletedIds = await loadDeletedEventIds();
  const [apiEvents, localEvents] = await Promise.all([
    fetchCommunityEventsFromApi(),
    listPublicCommunityEvents(),
  ]);

  return mergeCommunityEventsForDiscover(apiEvents, localEvents, deletedIds);
};
