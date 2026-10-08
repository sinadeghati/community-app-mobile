import type { CommunityEvent, CommunityEventInput } from "./communityEventTypes";
import {
  formatEventAddress,
  hasMinimumEventAddress,
  isValidEventZipCode,
} from "./eventLocation";
import { normalizeTicketUrl } from "./eventTickets";
import {
  resolveEventDateTimeIso,
  resolveEventEndDateTimeIso,
  syncEventEndScheduleFields,
  syncEventScheduleFields,
} from "./eventDateTime";
import { getEventScheduleIso, parseEventDate } from "./mapEvents";

export type ApiEventRow = Record<string, unknown>;

export const mapApiEventToCommunityEvent = (row: ApiEventRow): CommunityEvent => {
  const id = String(row.id ?? "");
  const title = String(row.title ?? "");
  const status = String(row.status ?? "published");
  const isPublished = status === "published";
  const scheduleIso =
    String(row.event_date ?? row.starts_at ?? row.eventDateIso ?? "").trim();
  const scheduleFields = syncEventScheduleFields(scheduleIso);
  const endIso = String(row.ends_at ?? row.endDateIso ?? "").trim();
  const endFields = endIso ? syncEventEndScheduleFields(endIso) : {};

  return {
    id,
    title,
    name: title,
    business_name: title,
    description: String(row.description ?? row.about ?? ""),
    about: String(row.about ?? row.description ?? ""),
    location: String(row.location ?? ""),
    address: String(
      row.address ??
        formatEventAddress({
          streetAddress: row.street_address as string | undefined,
          city: row.city as string | undefined,
          state: row.state as string | undefined,
          zipCode: row.zip_code as string | undefined,
          country: row.country as string | undefined,
        }) ??
        ""
    ),
    street_address: row.street_address as string | undefined,
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zip_code: row.zip_code as string | undefined,
    country: String(row.country ?? "United States"),
    category: String(row.category ?? row.business_category ?? "Event"),
    business_category: String(row.business_category ?? row.category ?? "Event"),
    owner_id: String(row.owner_id ?? ""),
    business_id: row.listing_id != null ? String(row.listing_id) : undefined,
    organizer: row.organizer as string | undefined,
    ticket_url: row.ticket_url as string | undefined,
    is_public: isPublished,
    is_active: true,
    is_published: isPublished,
    coordinates_exact:
      row.latitude != null &&
      row.longitude != null &&
      Number.isFinite(Number(row.latitude)) &&
      Number.isFinite(Number(row.longitude)),
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    lat: row.latitude as number | undefined,
    lng: row.longitude as number | undefined,
    image: (row.image_url ?? row.cover_image ?? row.image) as string | undefined,
    cover_image: (row.cover_image ?? row.image_url ?? row.image) as string | undefined,
    image_url: (row.image_url ?? row.cover_image ?? row.image) as string | undefined,
    event_date: scheduleIso,
    ...scheduleFields,
    ...endFields,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    status,
  } as CommunityEvent & { status?: string };
};

export const buildServerEventPayload = (
  input: CommunityEventInput,
  options?: { organizer?: string }
): Record<string, unknown> => {
  const title = input.title.trim();
  const streetAddress = input.streetAddress?.trim() || "";
  const city = input.city?.trim() || "";
  const state = input.state?.trim().toUpperCase() || "";
  const zipCode = input.zipCode?.trim() || "";
  const country = input.country?.trim() || "United States";
  const location =
    input.location?.trim() ||
    formatEventAddress({ streetAddress, city, state, zipCode, country });

  const eventDate = resolveEventDateTimeIso({
    eventDateIso: input.eventDateIso,
    date: input.date,
    time: input.time,
  });
  const endDate = resolveEventEndDateTimeIso({
    endDateIso: input.endDateIso,
    endDate: input.endDate,
    endTime: input.endTime,
  });

  const ticketUrlRaw = String(input.ticketUrl || "").trim();
  const ticketUrl = ticketUrlRaw ? normalizeTicketUrl(ticketUrlRaw) : null;

  const defaultCategory =
    input.category?.trim() ||
    (/\bfestival\b/i.test(title) ? "Festival" : "Community Gathering");

  const businessIdRaw = String(input.businessId || "").trim();
  const businessId = businessIdRaw ? Number(businessIdRaw) : null;

  const hasExactCoords =
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  return {
    title,
    description: input.description?.trim() || "",
    category: defaultCategory,
    starts_at: eventDate,
    eventDateIso: eventDate,
    ends_at: endDate || null,
    endDateIso: endDate || null,
    location,
    address: formatEventAddress({
      streetAddress,
      city,
      state,
      zipCode,
      country,
    }),
    street_address: streetAddress || undefined,
    city,
    state,
    zip_code: zipCode || undefined,
    country,
    latitude: hasExactCoords ? input.latitude : null,
    longitude: hasExactCoords ? input.longitude : null,
    organizer: options?.organizer?.trim() || undefined,
    ticket_url: ticketUrl || "",
    business_id: Number.isFinite(businessId) ? businessId : null,
    is_public: input.isPublic !== false,
  };
};

export const validateCommunityEventInput = (
  input: CommunityEventInput
): { ok: true } | { ok: false; message: string } => {
  const title = input.title.trim();
  const city = input.city?.trim() || "";
  const state = input.state?.trim().toUpperCase() || "";
  const zipCode = input.zipCode?.trim() || "";

  if (!title) {
    return { ok: false, message: "Event title is required." };
  }
  if (!hasMinimumEventAddress({ city, state })) {
    return {
      ok: false,
      message: "Event location is required. Enter city and state.",
    };
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
  if (zipCode && !isValidEventZipCode(zipCode)) {
    return { ok: false, message: "Please enter a valid ZIP code." };
  }
  const ticketUrlRaw = String(input.ticketUrl || "").trim();
  if (ticketUrlRaw && !normalizeTicketUrl(ticketUrlRaw)) {
    return {
      ok: false,
      message: "Please enter a valid ticket URL (https://...).",
    };
  }
  return { ok: true };
};

export const hasDisplayableServerEvent = (event: CommunityEvent) => {
  const hasLocation = Boolean(
    String(
      event.location ||
        event.address ||
        event.street_address ||
        event.city ||
        ""
    ).trim()
  );
  return hasLocation && Boolean(parseEventDate(event));
};

export const formatServerEventApiError = (error: unknown): string => {
  const fallback = "Could not save the event. Check your connection and try again.";
  if (!error || typeof error !== "object") return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (!data) {
    return (error as { message?: string }).message || fallback;
  }
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const parts: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        parts.push(value);
      }
    }
    if (parts.length) return parts.join("\n");
  }
  return fallback;
};

export { isServerEventId } from "./serverEventIds";
