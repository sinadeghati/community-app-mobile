import type { CommunityEventInput } from "./communityEventTypes";
import {
  formatEventAddress,
  hasMinimumEventAddress,
  isValidEventZipCode,
} from "./eventLocation";
import { normalizeTicketUrl } from "./eventTicketUrl";
import {
  resolveEventDateTimeIso,
  resolveEventEndDateTimeIso,
} from "./eventDateTime";

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
