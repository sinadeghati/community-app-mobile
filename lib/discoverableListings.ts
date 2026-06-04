import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

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
  services?: string;
  business_type?: string;
};

export const getListingId = (item: DiscoverableListing) => String(item?.id || "");

export const getListingCategory = (item: DiscoverableListing) =>
  item?.business_category || item?.category || "Local Business";

const getListingMenuHaystack = (item: DiscoverableListing) => {
  const raw = item.menu_items ?? item.menuItems;
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
      return (
        category === "food" ||
        category.includes("persian food") ||
        category.includes("restaurant")
      );
    case "Cafe":
      return (
        category.includes("cafe") ||
        category.includes("coffee") ||
        category.includes("bakery")
      );
    case "Beauty":
      return category.includes("beauty") || category.includes("salon");
    case "Real Estate":
      return category.includes("real estate") || category.includes("property");
    case "Services":
      return (
        category.includes("home service") ||
        category.includes("professional service") ||
        category.includes("professional") ||
        category.includes("legal") ||
        category.includes("construction")
      );
    default:
      return false;
  }
};

/** Searchable text from listing fields only (no synonym injection). */
export const getBaseSearchHaystack = (item: DiscoverableListing) => {
  const keywords = item.keywords;
  const keywordsText = Array.isArray(keywords)
    ? keywords.join(" ")
    : typeof keywords === "string"
      ? keywords
      : "";

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
    item.city,
    item.state,
    item.address,
    item.description,
    item.about,
    item.contact_info,
    item.phone,
    keywordsText,
    getListingMenuHaystack(item),
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");
};

export const isEventListing = (item: DiscoverableListing) => {
  const id = getListingId(item).toLowerCase();
  const category = getListingCategory(item).toLowerCase();

  if (id.startsWith("event-")) return true;
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

const matchesFood = (category: string, haystack: string) =>
  category.includes("restaurant") ||
  category.includes("food") ||
  category.includes("dining") ||
  category.includes("catering") ||
  category.includes("home food") ||
  haystack.includes("restaurant") ||
  haystack.includes("persian food") ||
  haystack.includes("catering") ||
  haystack.includes("tahchin") ||
  haystack.includes("home food") ||
  haystack.includes("kabob") ||
  haystack.includes("kebab");

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
  haystack.includes("real estate") ||
  haystack.includes("property");

const matchesServices = (category: string, haystack: string) => {
  if (
    matchesAuto(category, haystack) ||
    matchesFood(category, haystack) ||
    matchesCafe(category, haystack)
  ) {
    return false;
  }

  return (
    matchesBeauty(category, haystack) ||
    matchesHealth(category, haystack) ||
    matchesRealEstate(category, haystack) ||
    category.includes("service") ||
    category.includes("legal") ||
    category.includes("law") ||
    category.includes("construction") ||
    category.includes("professional") ||
    haystack.includes("home service") ||
    haystack.includes("legal") ||
    haystack.includes("construction") ||
    haystack.includes("lawyer") ||
    haystack.includes("attorney") ||
    haystack.includes("immigration") ||
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
  const aliases = getListingSearchAliasBlob(item);
  return [base, aliases].filter(Boolean).join(" ");
};

const tokenMatchesHaystack = (token: string, haystack: string) => {
  if (!token) return true;
  if (haystack.includes(token)) return true;

  if (token.length < 3) return false;

  return haystack.split(/\s+/).some((word) => {
    if (word.length < 2) return false;
    return word.includes(token) || token.includes(word);
  });
};

export const matchesListingSearch = (item: DiscoverableListing, query: string) => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;

  const haystack = getSearchHaystack(item);
  return tokens.every((token) => tokenMatchesHaystack(token, haystack));
};

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
  const haystack = getSearchHaystack(item);
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

  switch (selectedCategory) {
    case "Restaurant":
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
    default: {
      const selected = selectedCategory.toLowerCase();
      return category.includes(selected) || haystack.includes(selected);
    }
  }
};

/** Strict category matching; events only on All or Events. Search respects category unless All. */
export const matchesListingCategory = (
  item: DiscoverableListing,
  selectedCategory: string,
  _searchQuery?: string
) => {
  if (selectedCategory === "All") return true;
  return matchesCategoryKey(item, selectedCategory);
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
    if (id && !byId.has(id)) byId.set(id, item);
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

export const loadDiscoverableListings = async (): Promise<DiscoverableListing[]> => {
  let apiListings: DiscoverableListing[] = [];

  try {
    const response = await API.getListings();
    apiListings = Array.isArray(response) ? response : response?.results || [];
  } catch (e) {
    console.log("discoverableListings API error:", e);
  }

  const [local, profiles] = await Promise.all([
    loadLocalBusinesses(),
    loadProfileV2Businesses(),
  ]);

  return mergeListingsById(apiListings, [...local, ...profiles]);
};
