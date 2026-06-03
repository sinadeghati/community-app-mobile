import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export type DiscoverableListing = {
  id: number | string;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
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
};

export const getListingId = (item: DiscoverableListing) => String(item?.id || "");

export const getListingCategory = (item: DiscoverableListing) =>
  item?.business_category || item?.category || "Local Business";

export const getSearchHaystack = (item: DiscoverableListing) => {
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
    item.city,
    item.state,
    item.address,
    item.description,
    item.about,
    item.contact_info,
    item.phone,
    keywordsText,
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");
};

export const matchesListingSearch = (item: DiscoverableListing, query: string) => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;

  const haystack = getSearchHaystack(item);
  return tokens.every((token) => haystack.includes(token));
};

export const isEventListing = (item: DiscoverableListing) => {
  const id = getListingId(item).toLowerCase();
  const category = getListingCategory(item).toLowerCase();

  if (id.startsWith("event-")) return true;
  return /\bevents?\b/.test(category) || category.includes("concert");
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
  haystack.includes("home food");

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
  haystack.includes("home nurse") ||
  haystack.includes("medical") ||
  haystack.includes("health care");

const matchesBeauty = (category: string, haystack: string) =>
  category.includes("beauty") ||
  category.includes("salon") ||
  category.includes("spa") ||
  haystack.includes("beauty") ||
  haystack.includes("salon") ||
  haystack.includes("spa");

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
    haystack.includes("construction")
  );
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
    const raw = await AsyncStorage.getItem("my_local_businesses");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
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
