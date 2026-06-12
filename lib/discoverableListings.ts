import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";
import { logLoaderDone, logLoaderStart, withTimeout } from "./asyncGuards";
import { normalizeBusinessUpdates } from "./businessUpdates";
import {
  DISCOVERY_CATEGORY_FILTERS,
  discoveryQueryMatchesHaystack,
  findDiscoveryFilterKey,
  getCategorySearchTerms,
  getDiscoveryTagsSearchBlob,
  getInferredDiscoveryFilterKeys,
  getInferredDiscoveryTags,
} from "./discoverySearch";
import { getMapLat } from "./mapCoordinates";
import { setCachedDiscoverListings } from "./discoverListingsCache";

export type DiscoverableListing = {
  id: number | string;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
  subcategory?: string;
  business_subcategory?: string;
  city?: string;
  state?: string;
  address?: string;
  description?: string;
  about?: string;
  keywords?: string | string[];
  contact_info?: string;
  phone?: string;
  image?: string;
  image_url?: string;
  cover_image?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  is_verified?: boolean;
  is_featured?: boolean;
  rating?: number;
  reviews?: number;
  business_updates?: unknown;
  businessUpdates?: unknown;
  menu_items?: unknown;
  menuItems?: unknown;
  business_offerings?: unknown;
  businessOfferings?: unknown;
  services?: string;
  business_type?: string;
};

export const getListingId = (item: DiscoverableListing) => String(item?.id || "");

export const getListingCategory = (item: DiscoverableListing) =>
  item?.business_category || item?.category || "Local Business";

const getListingMenuHaystack = (item: DiscoverableListing) => {
  const raw =
    item.business_offerings ??
    item.businessOfferings ??
    item.menu_items ??
    item.menuItems;
  if (!Array.isArray(raw)) return "";

  return raw
    .map((entry) => {
      const row = entry as Record<string, unknown>;
      return [row.title, row.name, row.description]
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v) => String(v));
    })
    .flat()
    .join(" ");
};

/** Labels saved via create-business and other flows that map to Explore filters. */
const listingCategoryMatchesExploreFilter = (
  item: DiscoverableListing,
  selectedCategory: string
) => {
  const category = getListingCategory(item).toLowerCase();

  switch (selectedCategory) {
    case "Auto Repair":
      return (
        category === "auto" ||
        category.includes("auto repair") ||
        category.includes("automotive") ||
        category.includes("car repair") ||
        category.includes("mechanic")
      );
    case "Restaurant":
    case "Food":
      return (
        category === "food" ||
        category.includes("persian food") ||
        category.includes("iranian food") ||
        category.includes("restaurant") ||
        (category.includes("dining") && !category.includes("catering"))
      );
    case "Home Catering":
      return (
        category.includes("home catering") ||
        category.includes("home chef") ||
        category.includes("home food") ||
        category === "catering"
      );
    case "Legal":
      return (
        category.includes("lawyer") ||
        category.includes("legal") ||
        category.includes("attorney") ||
        category.includes("immigration")
      );
    case "Medical":
      return (
        category.includes("doctor") ||
        category.includes("medical") ||
        category.includes("clinic") ||
        category.includes("dentist") ||
        category.includes("health")
      );
    case "Insurance":
      return category.includes("insurance");
    case "Cafe":
      return (
        category.includes("cafe") ||
        category.includes("coffee") ||
        category.includes("bakery")
      );
    case "Beauty":
      return category.includes("beauty") || category.includes("salon");
    case "Real Estate":
      return (
        category.includes("real estate") ||
        category.includes("property") ||
        category.includes("realtor")
      );
    case "Services":
      return (
        (category.includes("home service") ||
          category.includes("professional service") ||
          category.includes("construction") ||
          category.includes("accounting") ||
          category.includes("tutor") ||
          category.includes("tax") ||
          category.includes("mortgage") ||
          category.includes("retail") ||
          category.includes("education") ||
          category === "other") &&
        !category.includes("lawyer") &&
        !category.includes("legal") &&
        !category.includes("attorney") &&
        !category.includes("immigration") &&
        !category.includes("insurance") &&
        !category.includes("doctor") &&
        !category.includes("medical") &&
        !category.includes("clinic")
      );
    default: {
      const selected = selectedCategory.toLowerCase();
      return (
        category === selected ||
        category.includes(selected) ||
        getBaseSearchHaystack(item).includes(selected)
      );
    }
  }
};

const getListingUpdateHaystack = (item: DiscoverableListing) => {
  const record = item as Record<string, unknown>;
  const updates = normalizeBusinessUpdates(
    record.business_updates ?? record.businessUpdates
  );

  return updates
    .flatMap((update) => [update.title, update.description])
    .filter((value) => value != null && String(value).trim() !== "")
    .join(" ");
};

/** Searchable text from listing fields only (no synonym injection). */
export const getBaseSearchHaystack = (item: DiscoverableListing) => {
  const keywords = item.keywords;
  const keywordsText = Array.isArray(keywords)
    ? keywords.join(" ")
    : typeof keywords === "string"
      ? keywords
      : "";
  const record = item as Record<string, unknown>;

  return [
    item.business_name,
    item.name,
    item.title,
    item.business_category,
    item.category,
    item.subcategory,
    item.business_subcategory,
    item.business_type,
    item.services,
    record.organizer,
    item.city,
    item.state,
    item.address,
    item.description,
    item.about,
    item.contact_info,
    item.phone,
    keywordsText,
    getListingMenuHaystack(item),
    getListingUpdateHaystack(item),
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");
};

export const isEventListing = (item: DiscoverableListing) => {
  const id = getListingId(item).toLowerCase();
  const category = getListingCategory(item).toLowerCase();

  if (id.startsWith("event-") || id.startsWith("festival-")) return true;
  return (
    /\bevents?\b/.test(category) ||
    category.includes("concert") ||
    category.includes("festival") ||
    category.includes("culture") ||
    category.includes("gathering") ||
    category.includes("party") ||
    category.includes("music")
  );
};

const matchesAuto = (category: string, haystack: string) => {
  if (haystack.includes("home nurse") || (/\bnurse\b/.test(haystack) && !/\bauto\b/.test(haystack))) {
    return false;
  }

  return (
    /\bauto\b/.test(category) ||
    category.includes("automotive") ||
    category.includes("car repair") ||
    category.includes("mechanic") ||
    category.includes("dealer") ||
    /\bauto\b/.test(haystack) ||
    haystack.includes("auto repair") ||
    haystack.includes("car repair") ||
    haystack.includes("car dealer") ||
    haystack.includes("mechanic")
  );
};

const matchesHomeCatering = (category: string, haystack: string) =>
  category.includes("home catering") ||
  category.includes("home chef") ||
  category.includes("home food") ||
  category === "catering" ||
  haystack.includes("home catering") ||
  haystack.includes("homemade food") ||
  haystack.includes("home chef") ||
  haystack.includes("ghazaye khanegi") ||
  haystack.includes("ashpazi khanegi");

const matchesFood = (category: string, haystack: string) => {
  if (
    matchesHomeCatering(category, haystack) &&
    !category.includes("restaurant") &&
    !haystack.includes("restaurant")
  ) {
    return false;
  }

  return (
    category.includes("restaurant") ||
    category === "food" ||
    category.includes("persian food") ||
    category.includes("iranian food") ||
    category.includes("dining") ||
    haystack.includes("restaurant") ||
    haystack.includes("persian food") ||
    haystack.includes("iranian food") ||
    haystack.includes("tahchin") ||
    haystack.includes("kabob") ||
    haystack.includes("kebab")
  );
};

const matchesCafe = (category: string, haystack: string) =>
  category.includes("cafe") ||
  category.includes("coffee") ||
  category.includes("bakery") ||
  category.includes("dessert") ||
  category.includes("pastry") ||
  category.includes("cake") ||
  haystack.includes("cafe") ||
  haystack.includes("coffee") ||
  haystack.includes("bakery") ||
  haystack.includes("dessert") ||
  haystack.includes("pastry") ||
  haystack.includes("cake");

const matchesHealth = (category: string, haystack: string) =>
  category.includes("health") ||
  category.includes("medical") ||
  category.includes("nurse") ||
  category.includes("clinic") ||
  category.includes("wellness") ||
  category.includes("dental") ||
  category.includes("dentist") ||
  category.includes("doctor") ||
  haystack.includes("home nurse") ||
  haystack.includes("medical") ||
  haystack.includes("health care") ||
  haystack.includes("dental") ||
  haystack.includes("dentist") ||
  haystack.includes("doctor");

const matchesBeauty = (category: string, haystack: string) =>
  category.includes("beauty") ||
  category.includes("salon") ||
  category.includes("spa") ||
  category.includes("hair") ||
  category.includes("nails") ||
  haystack.includes("beauty") ||
  haystack.includes("salon") ||
  haystack.includes("spa") ||
  haystack.includes("makeup") ||
  haystack.includes("eyebrow") ||
  haystack.includes("threading");

const matchesRealEstate = (category: string, haystack: string) =>
  category.includes("real estate") ||
  category.includes("property") ||
  category.includes("realtor") ||
  haystack.includes("real estate") ||
  haystack.includes("realtor") ||
  haystack.includes("property");

const matchesLegal = (category: string, haystack: string) =>
  category.includes("lawyer") ||
  category.includes("legal") ||
  category.includes("attorney") ||
  category.includes("immigration") ||
  haystack.includes("lawyer") ||
  haystack.includes("attorney") ||
  haystack.includes("legal") ||
  haystack.includes("immigration lawyer") ||
  haystack.includes("immigration");

const matchesMedical = (category: string, haystack: string) =>
  matchesHealth(category, haystack);

const matchesInsurance = (category: string, haystack: string) =>
  category.includes("insurance") || haystack.includes("insurance");

const matchesServices = (category: string, haystack: string) => {
  if (
    matchesAuto(category, haystack) ||
    matchesFood(category, haystack) ||
    matchesCafe(category, haystack) ||
    matchesHomeCatering(category, haystack) ||
    matchesBeauty(category, haystack) ||
    matchesMedical(category, haystack) ||
    matchesLegal(category, haystack) ||
    matchesInsurance(category, haystack) ||
    matchesRealEstate(category, haystack)
  ) {
    return false;
  }

  return (
    category.includes("home service") ||
    category.includes("professional service") ||
    category.includes("construction") ||
    category.includes("accounting") ||
    category.includes("tutor") ||
    category.includes("tax") ||
    category.includes("mortgage") ||
    category.includes("retail") ||
    category.includes("education") ||
    category === "other" ||
    category.includes("service") ||
    haystack.includes("home service") ||
    haystack.includes("construction") ||
    haystack.includes("mortgage") ||
    haystack.includes("accounting") ||
    haystack.includes("tutor") ||
    haystack.includes("tax service") ||
    haystack.includes("handyman")
  );
};

const AUTO_SEARCH_ALIASES = [
  "car",
  "cars",
  "mechanic",
  "repair",
  "auto repair",
  "dealer",
  "dealership",
  "automotive",
  "garage",
];

const FOOD_CAFE_SEARCH_ALIASES = [
  "food",
  "restaurant",
  "catering",
  "home food",
  "tahchin",
  "tah chin",
  "kabob",
  "kebab",
  "koobideh",
  "bakery",
  "pastry",
  "cake",
  "dessert",
  "cafe",
  "coffee",
];

const EVENT_SEARCH_ALIASES = [
  "music",
  "concert",
  "live music",
  "party",
  "festival",
  "nowruz",
  "yalda",
  "event",
  "events",
  "gathering",
  "celebration",
];

const BEAUTY_SEARCH_ALIASES = [
  "beauty",
  "hair",
  "salon",
  "makeup",
  "eyebrow",
  "threading",
  "nails",
  "spa",
  "wax",
];

const HEALTH_SEARCH_ALIASES = [
  "doctor",
  "nurse",
  "health",
  "clinic",
  "medical",
  "dental",
  "dentist",
  "wellness",
];

const SERVICES_SEARCH_ALIASES = [
  "lawyer",
  "attorney",
  "immigration",
  "real estate",
  "realtor",
  "construction",
  "handyman",
  "legal",
  "professional",
  "home service",
];

const matchesEventDiscovery = (
  category: string,
  haystack: string,
  item: DiscoverableListing
) => {
  if (isEventListing(item)) return true;

  return (
    /\b(events?|concert|live music|festival|nowruz|yalda|party|gathering|celebration)\b/.test(
      haystack
    ) || /\b(events?|concert|festival)\b/.test(category)
  );
};

/** Category synonym terms injected per listing for intent-based search. */
const getListingSearchAliasBlob = (item: DiscoverableListing) => {
  const category = getListingCategory(item).toLowerCase();
  const baseHaystack = getBaseSearchHaystack(item);
  const aliases: string[] = [];

  if (matchesEventDiscovery(category, baseHaystack, item)) {
    aliases.push(...EVENT_SEARCH_ALIASES);
  }
  if (matchesAuto(category, baseHaystack)) {
    aliases.push(...AUTO_SEARCH_ALIASES);
  }
  if (matchesFood(category, baseHaystack) || matchesCafe(category, baseHaystack)) {
    aliases.push(...FOOD_CAFE_SEARCH_ALIASES);
  }
  if (matchesBeauty(category, baseHaystack)) {
    aliases.push(...BEAUTY_SEARCH_ALIASES);
  }
  if (matchesHealth(category, baseHaystack)) {
    aliases.push(...HEALTH_SEARCH_ALIASES);
  }
  if (
    matchesServices(category, baseHaystack) ||
    matchesRealEstate(category, baseHaystack)
  ) {
    aliases.push(...SERVICES_SEARCH_ALIASES);
  }

  return aliases.join(" ");
};

export const getSearchHaystack = (item: DiscoverableListing) => {
  const base = getBaseSearchHaystack(item);
  const category = getListingCategory(item);
  const aliases = getListingSearchAliasBlob(item);
  const categoryTerms = getCategorySearchTerms(category);
  const discoveryTags = getDiscoveryTagsSearchBlob(base, category);
  return [base, aliases, categoryTerms, discoveryTags].filter(Boolean).join(" ");
};

/** Secondary discovery tags inferred from content (primary category unchanged). */
export const getListingDiscoveryTags = (item: DiscoverableListing) =>
  getInferredDiscoveryTags(
    getBaseSearchHaystack(item),
    getListingCategory(item)
  );

export type MapMarkerKind =
  | "auto"
  | "food"
  | "cafe"
  | "events"
  | "beauty"
  | "health"
  | "services";

/** Classify listing for map marker icon (cafe checked before food). */
export const getListingMarkerKind = (item: DiscoverableListing): MapMarkerKind => {
  const category = getListingCategory(item).toLowerCase();
  const haystack = getSearchHaystack(item);

  if (isEventListing(item)) return "events";
  if (matchesCafe(category, haystack)) return "cafe";
  if (matchesFood(category, haystack)) return "food";
  if (matchesAuto(category, haystack)) return "auto";
  if (matchesBeauty(category, haystack)) return "beauty";
  if (matchesHealth(category, haystack)) return "health";
  return "services";
};

const matchesCategoryKey = (
  item: DiscoverableListing,
  selectedCategory: string
) => {
  const category = getListingCategory(item).toLowerCase();
  // Category only — never use search alias blob (keeps category independent of search).
  const haystack = getBaseSearchHaystack(item);
  const isEvent = isEventListing(item);

  if (isEvent) {
    return selectedCategory === "Events";
  }

  if (selectedCategory === "Events") {
    return false;
  }

  if (listingCategoryMatchesExploreFilter(item, selectedCategory)) {
    return true;
  }

  const inferredFilterKeys = getInferredDiscoveryFilterKeys(haystack, category);
  if (inferredFilterKeys.includes(selectedCategory)) {
    return true;
  }

  switch (selectedCategory) {
    case "Restaurant":
    case "Food":
      return matchesFood(category, haystack);
    case "Cafe":
      return matchesCafe(category, haystack);
    case "Auto Repair":
      return matchesAuto(category, haystack);
    case "Beauty":
      return matchesBeauty(category, haystack);
    case "Services":
      return matchesServices(category, haystack);
    case "Real Estate":
      return matchesRealEstate(category, haystack);
    case "Legal":
      return matchesLegal(category, haystack);
    case "Medical":
      return matchesMedical(category, haystack);
    case "Insurance":
      return matchesInsurance(category, haystack);
    case "Home Catering":
      return matchesHomeCatering(category, haystack);
    default: {
      const selected = selectedCategory.toLowerCase();
      return category.includes(selected) || haystack.includes(selected);
    }
  }
};

/** Category filter only — combine with matchesListingSearch for Explore/Map (AND, never OR). */
export const matchesListingCategory = (
  item: DiscoverableListing,
  selectedCategory: string
) => {
  if (selectedCategory === "All") return true;
  return matchesCategoryKey(item, selectedCategory);
};

export const matchesListingSearch = (item: DiscoverableListing, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  if (discoveryQueryMatchesHaystack(trimmed, getSearchHaystack(item))) {
    return true;
  }

  const categoryIntent = findDiscoveryFilterKey(
    trimmed,
    [...DISCOVERY_CATEGORY_FILTERS]
  );
  if (categoryIntent && categoryIntent !== "All") {
    return matchesListingCategory(item, categoryIntent);
  }

  return false;
};

/**
 * Map-style discovery search: category-intent queries filter by bucket;
 * otherwise text/synonym match across the listing haystack.
 */
export const matchesDiscoverySearchFilter = (
  item: DiscoverableListing,
  query: string
) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const categoryIntent = findDiscoveryFilterKey(trimmed, [
    ...DISCOVERY_CATEGORY_FILTERS,
  ]);
  if (categoryIntent && categoryIntent !== "All") {
    if (categoryIntent === "Events") return isEventListing(item);
    if (isEventListing(item)) return false;
    return matchesListingCategory(item, categoryIntent);
  }

  return matchesListingSearch(item, trimmed);
};

/** Search AND category — both must pass; empty search does not bypass category. */
export const filterListingsBySearchAndCategory = (
  items: DiscoverableListing[],
  options: { query?: string; category?: string }
) => {
  const query = String(options.query ?? "").trim().toLowerCase();
  const category = options.category ?? "All";

  return items.filter(
    (item) =>
      matchesListingSearch(item, query) &&
      matchesListingCategory(item, category)
  );
};

const isCommunityEventListing = (item: DiscoverableListing) => {
  const id = getListingId(item).toLowerCase();
  return id.startsWith("event-") || id.startsWith("festival-");
};

const mergeListingRecords = (
  incoming: DiscoverableListing,
  existing: DiscoverableListing
): DiscoverableListing => {
  if (isCommunityEventListing(incoming)) return incoming;

  const inc = incoming as Record<string, unknown>;
  const ext = existing as Record<string, unknown>;

  if (inc.coordinates_exact === true && ext.coordinates_exact !== true) {
    return incoming;
  }
  if (ext.coordinates_exact === true && inc.coordinates_exact !== true) {
    return existing;
  }

  const incLat = getMapLat(incoming);
  const extLat = getMapLat(existing);
  if (incLat != null && extLat == null) return incoming;
  if (extLat != null && incLat == null) return existing;

  return { ...existing, ...incoming };
};

const mergeListingsById = (
  apiListings: DiscoverableListing[],
  extra: DiscoverableListing[]
) => {
  const byId = new Map<string, DiscoverableListing>();

  apiListings.forEach((item) => {
    const id = getListingId(item);
    if (id) byId.set(id, item);
  });

  extra.forEach((item) => {
    const id = getListingId(item);
    if (!id) return;

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, item);
      return;
    }

    byId.set(id, mergeListingRecords(item, existing));
  });

  return Array.from(byId.values());
};

const loadLocalBusinesses = async (): Promise<DiscoverableListing[]> => {
  try {
    const { getActiveUserId, loadUserBusinesses } = await import(
      "./userSessionStorage"
    );
    const userId = await getActiveUserId();
    if (!userId) return [];
    const parsed = await loadUserBusinesses(userId);
    return Array.isArray(parsed) ? (parsed as DiscoverableListing[]) : [];
  } catch {
    return [];
  }
};

const loadProfileV2Businesses = async (): Promise<DiscoverableListing[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const profileKeys = keys.filter((key) => key.startsWith("profile_v2_"));
    if (!profileKeys.length) return [];

    const pairs = await AsyncStorage.multiGet(profileKeys);
    return pairs
      .map(([, value]) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as DiscoverableListing;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as DiscoverableListing[];
  } catch {
    return [];
  }
};

const loadCommunityEventsSafe = async (): Promise<DiscoverableListing[]> => {
  try {
    const mod = await import("./communityEvents");
    return await mod.loadCommunityEventsForDiscover();
  } catch (error) {
    console.log("[loader] communityEvents error:", error);
    return [];
  }
};

export const loadDiscoverableListings = async (): Promise<DiscoverableListing[]> => {
  logLoaderStart("loadDiscoverableListings");
  let apiListings: DiscoverableListing[] = [];

  try {
    const response = await withTimeout(
      API.getListings(),
      12000,
      "loadDiscoverableListings.api",
      [] as DiscoverableListing[] | { results?: DiscoverableListing[] }
    );
    apiListings = Array.isArray(response)
      ? response
      : response?.results || [];
  } catch (e) {
    console.log("[loader] discoverableListings API error:", e);
  }

  const [local, profiles, communityEvents] = await Promise.all([
    withTimeout(loadLocalBusinesses(), 8000, "loadDiscoverableListings.local", []),
    withTimeout(
      loadProfileV2Businesses(),
      8000,
      "loadDiscoverableListings.profiles",
      []
    ),
    loadCommunityEventsSafe(),
  ]);

  console.log("[discover] community event ids", communityEvents.map(getListingId));

  const merged = mergeListingsById(apiListings, [
    ...profiles,
    ...local,
    ...communityEvents,
  ]);

  const mergedEventIds = merged
    .filter((item) => isEventListing(item))
    .map(getListingId);
  console.log("[discover] merged event ids", mergedEventIds);

  setCachedDiscoverListings(merged);
  logLoaderDone("loadDiscoverableListings");
  return merged;
};
