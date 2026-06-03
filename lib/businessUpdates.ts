export type BusinessUpdateType = "special" | "offer" | "event" | "announcement";

export type BusinessUpdate = {
  id: string;
  type: BusinessUpdateType;
  title: string;
  description?: string;
  image?: string;
  /** ISO 8601 — optional; hidden on profile after this instant */
  expiresAt?: string;
  createdAt: string;
};

export const BUSINESS_UPDATE_TYPES: {
  key: BusinessUpdateType;
  label: string;
}[] = [
  { key: "special", label: "Special" },
  { key: "offer", label: "Offer" },
  { key: "event", label: "Event" },
  { key: "announcement", label: "Announcement" },
];

export const createBusinessUpdateId = () =>
  `update-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createEmptyBusinessUpdate = (): BusinessUpdate => ({
  id: createBusinessUpdateId(),
  type: "announcement",
  title: "",
  description: "",
  image: "",
  expiresAt: "",
  createdAt: new Date().toISOString(),
});

const UPDATE_TYPES = new Set<BusinessUpdateType>([
  "special",
  "offer",
  "event",
  "announcement",
]);

export const normalizeBusinessUpdates = (raw: unknown): BusinessUpdate[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry: unknown) => {
      const item = entry as Record<string, unknown>;
      const title = String(item?.title || "").trim();
      if (!title) return null;

      const typeRaw = String(item?.type || "announcement").toLowerCase();
      const type = UPDATE_TYPES.has(typeRaw as BusinessUpdateType)
        ? (typeRaw as BusinessUpdateType)
        : "announcement";

      const description = String(item?.description || "").trim();
      const image = String(item?.image || item?.image_url || "").trim();
      const expiresAt = String(item?.expiresAt || item?.expires_at || "").trim();
      const createdAt = String(
        item?.createdAt || item?.created_at || new Date().toISOString()
      );

      return {
        id: String(item?.id || createBusinessUpdateId()),
        type,
        title,
        description: description || undefined,
        image: image || undefined,
        expiresAt: expiresAt || undefined,
        createdAt,
      } satisfies BusinessUpdate;
    })
    .filter(Boolean) as BusinessUpdate[];
};

export const getBusinessUpdates = (business?: {
  business_updates?: unknown;
  businessUpdates?: unknown;
} | null) =>
  normalizeBusinessUpdates(
    business?.business_updates ?? business?.businessUpdates
  );

export const sanitizeBusinessUpdatesForSave = (
  items: BusinessUpdate[]
): BusinessUpdate[] =>
  items
    .map((item) => {
      const title = item.title.trim();
      if (!title) return null;

      const description = item.description?.trim();
      const image = item.image?.trim();
      const expiresAt = item.expiresAt?.trim();

      return {
        id: item.id || createBusinessUpdateId(),
        type: item.type,
        title,
        description: description || undefined,
        image: image || undefined,
        expiresAt: expiresAt || undefined,
        createdAt: item.createdAt || new Date().toISOString(),
      } satisfies BusinessUpdate;
    })
    .filter(Boolean) as BusinessUpdate[];

export const isBusinessUpdateExpired = (update: BusinessUpdate, now = Date.now()) => {
  if (!update.expiresAt) return false;

  const expires = new Date(update.expiresAt).getTime();
  return !Number.isNaN(expires) && expires < now;
};

/** Profile / map display — newest first, optional hide expired */
export const getVisibleBusinessUpdates = (
  business?: { business_updates?: unknown; businessUpdates?: unknown } | null,
  options?: { includeExpired?: boolean }
) => {
  const includeExpired = options?.includeExpired ?? false;
  const items = getBusinessUpdates(business).filter(
    (item) => includeExpired || !isBusinessUpdateExpired(item)
  );

  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getBusinessUpdateTypeLabel = (type: BusinessUpdateType) =>
  BUSINESS_UPDATE_TYPES.find((entry) => entry.key === type)?.label ?? "Update";

/** Newest non-expired update for map badges / preview labels */
export const getPrimaryActiveBusinessUpdate = (
  business?: { business_updates?: unknown; businessUpdates?: unknown } | null
): BusinessUpdate | null => {
  const visible = getVisibleBusinessUpdates(business);
  return visible[0] ?? null;
};

/** e.g. SPECIAL · 20% off each Tuesday */
export const formatMapActiveUpdateLabel = (update: BusinessUpdate): string => {
  const typeLabel = getBusinessUpdateTypeLabel(update.type).toUpperCase();
  return `${typeLabel} · ${update.title}`;
};

export const formatBusinessUpdateExpiration = (expiresAt?: string) => {
  if (!expiresAt) return null;

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;

  return `Ends ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

/** Parse YYYY-MM-DD from edit form into end-of-day ISO */
export const parseExpirationDateInput = (input: string): string | undefined => {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(
      `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59.000`
    );
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const formatExpirationDateInput = (expiresAt?: string) => {
  if (!expiresAt) return "";

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
