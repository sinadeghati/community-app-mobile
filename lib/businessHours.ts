export const WEEKDAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

export type BusinessDayHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type BusinessHours = Record<WeekdayKey, BusinessDayHours>;

const JS_DAY_TO_KEY: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const createDefaultBusinessHours = (): BusinessHours => ({
  monday: { closed: false, open: "09:00", close: "18:00" },
  tuesday: { closed: false, open: "09:00", close: "18:00" },
  wednesday: { closed: false, open: "09:00", close: "18:00" },
  thursday: { closed: false, open: "09:00", close: "18:00" },
  friday: { closed: false, open: "09:00", close: "18:00" },
  saturday: { closed: false, open: "10:00", close: "16:00" },
  sunday: { closed: true, open: "09:00", close: "18:00" },
});

export const parseTimeInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = Math.min(23, Math.max(0, parseInt(h24[1], 10)));
    const minutes = Math.min(59, Math.max(0, parseInt(h24[2], 10)));
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  const h12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (h12) {
    let hours = parseInt(h12[1], 10) % 12;
    const minutes = Math.min(59, Math.max(0, parseInt(h12[2], 10)));
    if (h12[3].toUpperCase() === "PM") hours += 12;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  return null;
};

export const formatTime12 = (time24: string) => {
  const minutes = parseTimeToMinutes(time24);
  if (minutes == null) return time24;

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
};

const parseTimeToMinutes = (time24: string): number | null => {
  const normalized = parseTimeInput(time24);
  if (!normalized) return null;

  const [h, m] = normalized.split(":").map((part) => parseInt(part, 10));
  return h * 60 + m;
};

export const normalizeBusinessHours = (raw: unknown): BusinessHours | null => {
  if (!raw || typeof raw !== "object") return null;

  const result = {} as Partial<BusinessHours>;

  WEEKDAYS.forEach(({ key }) => {
    const entry = (raw as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object") return;

    const day = entry as Record<string, unknown>;
    const open = parseTimeInput(String(day.open || "")) || "09:00";
    const close = parseTimeInput(String(day.close || "")) || "18:00";

    result[key] = {
      closed: Boolean(day.closed),
      open,
      close,
    };
  });

  return WEEKDAYS.every(({ key }) => result[key]) ? (result as BusinessHours) : null;
};

export const sanitizeBusinessHoursForSave = (
  hours: BusinessHours
): BusinessHours => {
  const result = {} as BusinessHours;

  WEEKDAYS.forEach(({ key }) => {
    const day = hours[key] || createDefaultBusinessHours()[key];
    result[key] = {
      closed: Boolean(day.closed),
      open: parseTimeInput(day.open) || "09:00",
      close: parseTimeInput(day.close) || "18:00",
    };
  });

  return result;
};

export type BusinessHoursRecord = {
  business_hours?: unknown;
  businessHours?: unknown;
  hours_configured?: boolean;
};

export const getBusinessHoursFromRecord = (
  business?: BusinessHoursRecord | null
) => {
  if (!business?.hours_configured) return null;
  return normalizeBusinessHours(business.business_hours ?? business.businessHours);
};

/** Shared entry point for map, profile, and listing UIs. */
export const getItemHoursDisplay = (
  business?: BusinessHoursRecord | null,
  now?: Date
) => getBusinessHoursDisplay(getBusinessHoursFromRecord(business), now);

export const getTodayWeekdayKey = (now = new Date()): WeekdayKey =>
  JS_DAY_TO_KEY[now.getDay()];

export const formatDayHoursRange = (day: BusinessDayHours) => {
  if (day.closed) return "Closed";
  return `${formatTime12(day.open)} – ${formatTime12(day.close)}`;
};

export type WeeklyHoursRow = {
  key: WeekdayKey;
  label: string;
  hoursText: string;
  isToday: boolean;
};

export const getWeeklyHoursRows = (
  hours: BusinessHours | null,
  now = new Date()
): WeeklyHoursRow[] => {
  if (!hours) return [];

  const todayKey = getTodayWeekdayKey(now);

  return WEEKDAYS.map(({ key, label }) => ({
    key,
    label,
    hoursText: formatDayHoursRange(hours[key]),
    isToday: key === todayKey,
  }));
};

export type BusinessHoursDisplay = {
  configured: boolean;
  primary: string;
  secondary?: string;
  tone: "open" | "closed" | "neutral";
};

const findNextOpen = (hours: BusinessHours, from: Date) => {
  for (let offset = 1; offset <= 7; offset += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + offset);
    const key = JS_DAY_TO_KEY[date.getDay()];
    const day = hours[key];

    if (!day.closed) {
      const label = WEEKDAYS.find((d) => d.key === key)?.label || key;
      return { dayLabel: label, open: day.open };
    }
  }

  return null;
};

export const getBusinessHoursDisplay = (
  hours: BusinessHours | null,
  now = new Date()
): BusinessHoursDisplay => {
  if (!hours) {
    return { configured: false, primary: "Hours not added", tone: "neutral" };
  }

  const todayKey = JS_DAY_TO_KEY[now.getDay()];
  const today = hours[todayKey];

  if (today.closed) {
    const next = findNextOpen(hours, now);
    return {
      configured: true,
      primary: "Closed now",
      secondary: next
        ? `Opens ${next.dayLabel} at ${formatTime12(next.open)}`
        : undefined,
      tone: "closed",
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(today.open);
  const closeMinutes = parseTimeToMinutes(today.close);

  if (openMinutes == null || closeMinutes == null) {
    return { configured: true, primary: "Hours not added", tone: "neutral" };
  }

  if (currentMinutes < openMinutes) {
    return {
      configured: true,
      primary: `Opens at ${formatTime12(today.open)}`,
      tone: "neutral",
    };
  }

  if (currentMinutes >= closeMinutes) {
    const next = findNextOpen(hours, now);
    return {
      configured: true,
      primary: "Closed now",
      secondary: next
        ? `Opens ${next.dayLabel} at ${formatTime12(next.open)}`
        : `Opens at ${formatTime12(today.open)}`,
      tone: "closed",
    };
  }

  return {
    configured: true,
    primary: "Open now",
    secondary: `Closes at ${formatTime12(today.close)}`,
    tone: "open",
  };
};
