import type { DiscoverableListing } from "./discoverableListings";
import { getListingMarkerKind, isEventListing } from "./discoverableListings";

export type EventTimeFilter = "all" | "today" | "week" | "month" | "later";

export type EventMapItem = DiscoverableListing & {
  event_date?: string;
  eventDate?: string;
  eventDateIso?: string;
  starts_at?: string;
  start_time?: string;
  start_date?: string;
  date?: string;
  datetime?: string;
};

export type EventMarkerVisual = {
  icon: "musical-notes-outline" | "sparkles-outline" | "star-outline" | "people-outline";
  accent: string;
};

const EVENT_ACCENT = "#7C3AED";

export const isMapEvent = (item: DiscoverableListing) =>
  isEventListing(item) || getListingMarkerKind(item) === "events";

export const getEventScheduleIso = (item: EventMapItem): string => {
  const raw =
    item.event_date ??
    item.eventDate ??
    item.eventDateIso ??
    item.starts_at ??
    item.start_time ??
    item.datetime ??
    item.start_date ??
    item.date;

  return String(raw || "").trim();
};

export const parseEventDate = (item: EventMapItem): Date | null => {
  const raw =
    item.event_date ??
    item.eventDate ??
    item.eventDateIso ??
    item.starts_at ??
    item.start_time ??
    item.datetime ??
    item.start_date ??
    item.date;

  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getEventTimeBucket = (
  item: EventMapItem
): "today" | "week" | "month" | "later" | "unknown" | "past" => {
  const eventDate = parseEventDate(item);
  if (!eventDate) return "unknown";

  const now = new Date();
  const todayStart = startOfDay(now);
  const eventDay = startOfDay(eventDate);

  if (eventDay < todayStart) return "past";

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((eventDay.getTime() - todayStart.getTime()) / dayMs);

  if (diffDays === 0) return "today";
  if (diffDays < 7) return "week";
  if (diffDays < 31) return "month";
  return "later";
};

export const matchesEventTimeFilter = (
  item: EventMapItem,
  filter: EventTimeFilter
) => {
  if (filter === "all") return true;

  const bucket = getEventTimeBucket(item);
  if (bucket === "past") return false;
  if (bucket === "unknown") return filter === "later";

  if (filter === "today") return bucket === "today";
  if (filter === "week") return bucket === "today" || bucket === "week";
  if (filter === "month") {
    return bucket === "today" || bucket === "week" || bucket === "month";
  }
  return bucket === "later";
};

export const isUpcomingEvent = (item: EventMapItem) => {
  const eventDate = parseEventDate(item);
  if (!eventDate) return true;

  const todayStart = startOfDay(new Date());
  return startOfDay(eventDate) >= todayStart;
};

export const sortEventsByDate = (events: EventMapItem[]) =>
  [...events].sort((a, b) => {
    const aDate = parseEventDate(a);
    const bDate = parseEventDate(b);
    if (aDate && bDate) return aDate.getTime() - bDate.getTime();
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
  });

export const formatEventDateTime = (item: EventMapItem) => {
  const eventDate = parseEventDate(item);
  if (!eventDate) return "Date coming soon";

  return eventDate.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatEventLocation = (item: EventMapItem) => {
  const record = item as EventMapItem & {
    street_address?: string;
    zip_code?: string;
    country?: string;
  };

  const street = record.street_address
    ? String(record.street_address).trim()
    : "";
  const city = item.city ? String(item.city).trim() : "";
  const state = item.state ? String(item.state).trim() : "";
  const zip = record.zip_code ? String(record.zip_code).trim() : "";
  const country = record.country ? String(record.country).trim() : "";
  const address = item.address ? String(item.address).trim() : "";

  if (address) return address;

  const cityStateZip = [city, state, zip].filter(Boolean).join(", ");
  if (street && cityStateZip) {
    const withStreet = `${street}, ${cityStateZip}`;
    if (
      !country ||
      /^united states$/i.test(country) ||
      country === "USA"
    ) {
      return withStreet;
    }
    return `${withStreet}, ${country}`;
  }

  if (cityStateZip) return cityStateZip;
  return [city, state].filter(Boolean).join(", ");
};

export const getEventMarkerVisual = (item: EventMapItem): EventMarkerVisual => {
  const haystack = [
    item.title,
    item.name,
    item.business_name,
    item.category,
    item.business_category,
    item.description,
    item.about,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/concert|live music|dj|band|performance|music/.test(haystack)) {
    return { icon: "musical-notes-outline", accent: EVENT_ACCENT };
  }

  if (/party|celebration|yalda|nowruz|festival|culture|haft/.test(haystack)) {
    return { icon: "sparkles-outline", accent: EVENT_ACCENT };
  }

  if (/network|meetup|community|gathering/.test(haystack)) {
    return { icon: "people-outline", accent: EVENT_ACCENT };
  }

  return { icon: "star-outline", accent: EVENT_ACCENT };
};
