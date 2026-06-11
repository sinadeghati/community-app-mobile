export const formatEventDateDisplay = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const formatEventTimeDisplay = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

export const combineDateAndTimeToIso = (date: Date, time: Date) => {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
};

/** Keep event schedule fields aligned for discover/map filters and API payloads. */
export const syncEventScheduleFields = (iso: string) => {
  const trimmed = String(iso || "").trim();
  if (!trimmed) return {};

  const parsed = new Date(trimmed);
  const eventDateIso = Number.isNaN(parsed.getTime())
    ? trimmed
    : parsed.toISOString();

  return {
    event_date: eventDateIso,
    eventDate: eventDateIso,
    eventDateIso: eventDateIso,
    starts_at: eventDateIso,
    start_time: eventDateIso,
    start_date: eventDateIso.slice(0, 10),
    date: eventDateIso,
    datetime: eventDateIso,
  };
};

export const splitIsoToDateAndTime = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: null, time: null };
  }

  const date = new Date(parsed);
  date.setHours(0, 0, 0, 0);

  const time = new Date(parsed);
  return { date, time };
};

const normalizeTimeText = (time: string) =>
  time
    .trim()
    .replace(/\ba\.?\s*m\.?\b/gi, "AM")
    .replace(/\bp\.?\s*m\.?\b/gi, "PM")
    .replace(/(\d)(am|pm)\b/gi, "$1 $2")
    .replace(/\s+/g, " ");

const parseSlashDate = (text: string): Date | null => {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;

  let year = Number(match[3]);
  if (year < 100) year += 2000;

  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const candidate = new Date(year, month, day);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
};

export const parseTimeParts = (
  text: string
): { hours: number; minutes: number } | null => {
  const normalized = normalizeTimeText(text);
  if (!normalized) return null;

  let match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (hours === 12) {
      hours = meridiem === "AM" ? 0 : 12;
    } else if (meridiem === "PM") {
      hours += 12;
    }

    return { hours, minutes };
  }

  match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
  }

  return null;
};

export const parseDateText = (dateText: string): Date | null => {
  const trimmed = dateText.trim();
  if (!trimmed) return null;

  const slashDate = parseSlashDate(trimmed);
  if (slashDate) return slashDate;

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  return null;
};

export const parseEventDateTime = (
  date: string,
  time?: string
): string | null => {
  const datePart = parseDateText(date);
  if (!datePart) return null;

  const timeText = String(time || "").trim();
  if (!timeText) {
    const noon = new Date(datePart);
    noon.setHours(12, 0, 0, 0);
    return noon.toISOString();
  }

  const timeParts = parseTimeParts(timeText);
  if (timeParts) {
    const combined = new Date(datePart);
    combined.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    return combined.toISOString();
  }

  const candidates = [
    `${date.trim()} ${normalizeTimeText(timeText)}`,
    date.trim(),
  ];

  for (const candidate of candidates) {
    const parsed = Date.parse(candidate);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  const fallback = new Date(datePart);
  fallback.setHours(12, 0, 0, 0);
  return fallback.toISOString();
};

export const resolveEventDateTimeIso = (options: {
  eventDateIso?: string | null;
  date?: string;
  time?: string;
  selectedDate?: Date | null;
  selectedTime?: Date | null;
}): string | null => {
  if (options.eventDateIso) {
    const parsed = new Date(options.eventDateIso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (options.selectedDate && options.selectedTime) {
    return combineDateAndTimeToIso(options.selectedDate, options.selectedTime);
  }

  if (options.selectedDate && !String(options.time || "").trim()) {
    const noon = new Date(options.selectedDate);
    noon.setHours(12, 0, 0, 0);
    return noon.toISOString();
  }

  if (options.date) {
    return parseEventDateTime(options.date, options.time);
  }

  return null;
};

export const defaultEventDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const defaultEventTime = () => {
  const time = new Date();
  time.setHours(19, 0, 0, 0);
  return time;
};
