export type BusinessOfferingCategory = "service" | "product";

export type BusinessOfferingAvailability =
  | "available"
  | "sold_out"
  | "appointment_only";

export type BusinessOffering = {
  id: string;
  title: string;
  description?: string;
  price?: string;
  image?: string;
  category: BusinessOfferingCategory;
  featured?: boolean;
  discountPercent?: number;
  availability: BusinessOfferingAvailability;
};

export const BUSINESS_OFFERING_CATEGORIES: ReadonlyArray<{
  key: BusinessOfferingCategory;
  label: string;
}> = [
  { key: "service", label: "Service" },
  { key: "product", label: "Product" },
];

export const BUSINESS_OFFERING_AVAILABILITY: ReadonlyArray<{
  key: BusinessOfferingAvailability;
  label: string;
}> = [
  { key: "available", label: "Available" },
  { key: "sold_out", label: "Sold Out" },
  { key: "appointment_only", label: "Appointment Only" },
];

export const getOfferingCategoryLabel = (
  category: BusinessOfferingCategory
): string =>
  BUSINESS_OFFERING_CATEGORIES.find((entry) => entry.key === category)?.label ??
  "Service";

export const getOfferingAvailabilityLabel = (
  availability: BusinessOfferingAvailability
): string =>
  BUSINESS_OFFERING_AVAILABILITY.find((entry) => entry.key === availability)
    ?.label ?? "Available";

export const createBusinessOfferingId = () =>
  `offering-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createEmptyBusinessOffering = (): BusinessOffering => ({
  id: createBusinessOfferingId(),
  title: "",
  description: "",
  price: "",
  image: "",
  category: "service",
  featured: false,
  availability: "available",
});

const parseCategory = (raw: unknown): BusinessOfferingCategory => {
  const value = String(raw || "service").toLowerCase();
  return value === "product" ? "product" : "service";
};

const parseAvailability = (raw: unknown): BusinessOfferingAvailability => {
  const value = String(raw || "available")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (value === "sold_out") return "sold_out";
  if (value === "appointment_only") return "appointment_only";
  return "available";
};

export const parseOfferingDiscountPercent = (
  raw: unknown
): number | undefined => {
  if (raw == null || raw === "") return undefined;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return undefined;

  return Math.round(parsed);
};

export const formatOfferingDiscountLabel = (
  discountPercent?: number
): string | null =>
  discountPercent != null && discountPercent > 0
    ? `${discountPercent}% off`
    : null;

const parseDiscountPercent = parseOfferingDiscountPercent;

const readOfferingSource = (business?: {
  business_offerings?: unknown;
  businessOfferings?: unknown;
  menu_items?: unknown;
  menuItems?: unknown;
} | null): unknown => {
  if (!business) return [];

  return (
    business.business_offerings ??
    business.businessOfferings ??
    business.menu_items ??
    business.menuItems ??
    []
  );
};

export const normalizeBusinessOfferings = (raw: unknown): BusinessOffering[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry: unknown) => {
      const item = entry as Record<string, unknown>;
      const title = String(item?.title || item?.name || "").trim();

      if (!title) return null;

      const description = String(item?.description || "").trim();
      const price = String(item?.price || "").trim();
      const image = String(item?.image || item?.image_url || "").trim();

      return {
        id: String(item?.id || createBusinessOfferingId()),
        title,
        description: description || undefined,
        price: price || undefined,
        image: image || undefined,
        category: parseCategory(item?.category ?? item?.offering_category),
        featured: item?.featured === true || item?.is_featured === true || undefined,
        discountPercent: parseDiscountPercent(
          item?.discountPercent ?? item?.discount_percent ?? item?.discount
        ),
        availability: parseAvailability(
          item?.availability ?? item?.availability_status
        ),
      } satisfies BusinessOffering;
    })
    .filter(Boolean) as BusinessOffering[];
};

export const getBusinessOfferings = (business?: {
  business_offerings?: unknown;
  businessOfferings?: unknown;
  menu_items?: unknown;
  menuItems?: unknown;
} | null): BusinessOffering[] =>
  normalizeBusinessOfferings(readOfferingSource(business));

export const sanitizeBusinessOfferingsForSave = (
  items: BusinessOffering[]
): BusinessOffering[] =>
  items
    .map((item) => {
      const title = item.title.trim();
      if (!title) return null;

      const description = item.description?.trim();
      const price = item.price?.trim();
      const image = item.image?.trim();
      const category = parseCategory(item.category);
      const availability = parseAvailability(item.availability);
      const discountPercent = parseDiscountPercent(item.discountPercent);
      const featured = item.featured === true;

      return {
        id: item.id || createBusinessOfferingId(),
        title,
        description: description || undefined,
        price: price || undefined,
        image: image || undefined,
        category,
        offering_category: category,
        featured: featured || undefined,
        is_featured: featured || undefined,
        discountPercent,
        discount_percent: discountPercent,
        discount: discountPercent,
        availability,
        availability_status: availability,
      } as BusinessOffering & Record<string, unknown>;
    })
    .filter(Boolean) as BusinessOffering[];
