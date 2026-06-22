import type { DiscoverableListing } from "./discoverableListings";
import {
  isEventListing,
  matchesDiscoverySearchFilter,
} from "./discoverableListings";
import {
  getCityFallbackCoordinate,
  getMapLat,
  getMapLng,
  parseCityKey,
} from "./mapCoordinates";
import type { AppLocationBounds, AppLocationState } from "./appLocation";

export const DEFAULT_SEARCH_RADIUS_KM = 45;
export const DEFAULT_CURRENT_RADIUS_KM = 35;

const distanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinBounds = (
  latitude: number,
  longitude: number,
  bounds: AppLocationBounds
) =>
  latitude >= bounds.southWest.latitude &&
  latitude <= bounds.northEast.latitude &&
  longitude >= bounds.southWest.longitude &&
  longitude <= bounds.northEast.longitude;

export const getListingFilterCoordinates = (
  item: DiscoverableListing
): { latitude: number; longitude: number } | null => {
  const lat = getMapLat(item);
  const lng = getMapLng(item);

  if (lat != null && lng != null) {
    return { latitude: lat, longitude: lng };
  }

  if (isEventListing(item)) {
    const fallback = getCityFallbackCoordinate(item);
    return { latitude: fallback.latitude, longitude: fallback.longitude };
  }

  return null;
};

export const getListingLocationHaystack = (item: DiscoverableListing) => {
  const record = item as Record<string, unknown>;
  const parsedCity = parseCityKey(item);
  return [
    item.city,
    item.state,
    item.address,
    record.location,
    record.region,
    record.zip_code,
    record.zipCode,
    parsedCity,
    item.description,
    item.about,
  ]
    .filter((value) => value != null && String(value).trim() !== "")
    .join(" ")
    .toLowerCase();
};

export const listingMatchesLocationLabel = (
  item: DiscoverableListing,
  label: string
) => {
  const terms = label
    .toLowerCase()
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);

  if (!terms.length) return true;

  const haystack = getListingLocationHaystack(item);
  return terms.some((term) => haystack.includes(term));
};

/** Active location radius/bounds, or — when searching — listings in the searched place. */
export const listingMatchesDiscoveryLocation = (
  item: DiscoverableListing,
  location: AppLocationState,
  options?: { searchQuery?: string }
): boolean => {
  if (listingMatchesActiveLocation(item, location)) {
    return true;
  }

  const trimmed = String(options?.searchQuery ?? "").trim();
  if (!trimmed) {
    return false;
  }

  return listingMatchesLocationLabel(item, trimmed);
};

/** Text search plus location-aware place queries (e.g. "San Diego"). */
export const matchesDiscoverySearchQuery = (
  item: DiscoverableListing,
  query: string
) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  return (
    matchesDiscoverySearchFilter(item, trimmed) ||
    listingMatchesLocationLabel(item, trimmed)
  );
};

export const listingMatchesActiveLocation = (
  item: DiscoverableListing,
  location: AppLocationState
): boolean => {
  const coords = getListingFilterCoordinates(item);

  if (location.source === "viewport" && location.bounds) {
    if (coords) {
      return isWithinBounds(
        coords.latitude,
        coords.longitude,
        location.bounds
      );
    }
    return listingMatchesLocationLabel(item, location.regionLabel);
  }

  const radiusKm = location.radiusKm ?? DEFAULT_SEARCH_RADIUS_KM;

  if (coords) {
    return (
      distanceKm(
        coords.latitude,
        coords.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      ) <= radiusKm
    );
  }

  return listingMatchesLocationLabel(item, location.regionLabel);
};
