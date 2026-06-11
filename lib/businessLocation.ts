import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiscoverableListing } from "./discoverableListings";
import { getListingId, isEventListing } from "./discoverableListings";
import {
  geocodeAddress,
  geocodeStructuredAddress,
} from "./addressAutocomplete";

const DOWNTOWN_SAN_DIEGO = { latitude: 32.7157, longitude: -117.1611 };

export const isPlaceholderCoordinate = (latitude: number, longitude: number) =>
  Math.abs(latitude - DOWNTOWN_SAN_DIEGO.latitude) < 0.002 &&
  Math.abs(longitude - DOWNTOWN_SAN_DIEGO.longitude) < 0.002;

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

const isNearDowntownSanDiego = (latitude: number, longitude: number, maxKm = 1.5) =>
  distanceKm(
    latitude,
    longitude,
    DOWNTOWN_SAN_DIEGO.latitude,
    DOWNTOWN_SAN_DIEGO.longitude
  ) <= maxKm;

const geocodeCache = new Map<string, { latitude: number; longitude: number }>();

export type BusinessAddressInput = {
  streetAddress?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
};

export const getBusinessListingAddress = (item: DiscoverableListing) => {
  const record = item as Record<string, unknown>;
  const formatted = formatBusinessAddress({
    streetAddress: String(record.street_address || ""),
    city: String(item.city || ""),
    state: String(item.state || ""),
    zipCode: String(record.zip_code || record.zip || ""),
  });

  return String(item.address || formatted).trim();
};

export const hasGeocodableBusinessAddress = (item: DiscoverableListing) => {
  const address = getBusinessListingAddress(item);
  if (!address) return false;

  const record = item as Record<string, unknown>;
  const street = String(record.street_address || "").trim();
  return Boolean(street) || /^\d+\s/.test(address);
};

export const hasTrustedBusinessMapCoordinates = (
  item: DiscoverableListing,
  latitude?: number | null,
  longitude?: number | null
) => {
  const lat = Number(latitude ?? item.latitude ?? item.lat);
  const lng = Number(longitude ?? item.longitude ?? item.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (isPlaceholderCoordinate(lat, lng)) return false;

  if (hasGeocodableBusinessAddress(item) && isNearDowntownSanDiego(lat, lng)) {
    return false;
  }

  return true;
};

const applyBusinessCoordinates = <T extends DiscoverableListing>(
  item: T,
  latitude: number,
  longitude: number
): T =>
  ({
    ...item,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    coordinates_exact: true,
  }) as T;

const persistBusinessCoordinatesFix = async (
  businessId: string,
  latitude: number,
  longitude: number
) => {
  if (!businessId) return;

  try {
    const key = `profile_v2_${businessId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return;

    const record = JSON.parse(raw) as Record<string, unknown>;
    const updated = {
      ...record,
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      coordinates_exact: true,
    };

    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // best effort cache repair
  }
};

export const logBusinessMapVsDirections = (
  item: DiscoverableListing,
  mapLatitude: number | null,
  mapLongitude: number | null
) => {
  const record = item as Record<string, unknown>;
  const directionsQuery = getBusinessDirectionsQuery(record);

  console.log("BUSINESS_MAP_VS_DIRECTIONS", {
    id: getListingId(item),
    name: item.business_name || item.name || item.title,
    directionsQuery,
    directionsUsesCoordinates: Boolean(
      directionsQuery && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(directionsQuery)
    ),
    mapLatitude,
    mapLongitude,
    savedLatitude: item.latitude ?? item.lat ?? null,
    savedLongitude: item.longitude ?? item.lng ?? null,
    address: getBusinessListingAddress(item),
  });
};

export const ensureBusinessMapCoordinates = async <T extends DiscoverableListing>(
  item: T
): Promise<T> => {
  if (isEventListing(item)) return item;

  const id = getListingId(item);
  const cached = id ? geocodeCache.get(id) : undefined;
  if (cached && hasTrustedBusinessMapCoordinates(item, cached.latitude, cached.longitude)) {
    const resolved = applyBusinessCoordinates(item, cached.latitude, cached.longitude);
    logBusinessMapVsDirections(resolved, cached.latitude, cached.longitude);
    return resolved;
  }

  if (hasTrustedBusinessMapCoordinates(item)) {
    const lat = Number(item.latitude ?? item.lat);
    const lng = Number(item.longitude ?? item.lng);
    const resolved = applyBusinessCoordinates(item, lat, lng);
    if (id) geocodeCache.set(id, { latitude: lat, longitude: lng });
    logBusinessMapVsDirections(resolved, lat, lng);
    return resolved;
  }

  const record = item as Record<string, unknown>;
  const address = getBusinessListingAddress(item);
  if (!hasGeocodableBusinessAddress(item)) {
    logBusinessMapVsDirections(item, null, null);
    return item;
  }

  const structured = await geocodeStructuredAddress({
    streetAddress: String(record.street_address || ""),
    city: String(item.city || ""),
    state: String(item.state || ""),
    zipCode: String(record.zip_code || record.zip || ""),
    country: "United States",
  });

  let geocoded = structured;
  if (
    !geocoded ||
    !hasTrustedBusinessMapCoordinates(item, geocoded.latitude, geocoded.longitude)
  ) {
    geocoded = await geocodeAddress(address);
  }

  if (
    !geocoded ||
    !hasTrustedBusinessMapCoordinates(item, geocoded.latitude, geocoded.longitude)
  ) {
    logBusinessMapVsDirections(item, null, null);
    return item;
  }

  if (id) {
    geocodeCache.set(id, geocoded);
    void persistBusinessCoordinatesFix(id, geocoded.latitude, geocoded.longitude);
  }

  const resolved = applyBusinessCoordinates(
    item,
    geocoded.latitude,
    geocoded.longitude
  );
  logBusinessMapVsDirections(resolved, geocoded.latitude, geocoded.longitude);
  logBusinessMapCoordinates(resolved, geocoded.latitude, geocoded.longitude, "geocoded");
  return resolved;
};

export const ensureBusinessMapCoordinatesBatch = async <
  T extends DiscoverableListing,
>(
  items: T[]
): Promise<T[]> =>
  Promise.all(
    items.map((item) =>
      isEventListing(item)
        ? Promise.resolve(item)
        : ensureBusinessMapCoordinates(item)
    )
  );

export const formatBusinessAddress = ({
  streetAddress = "",
  city,
  state,
  zipCode,
}: BusinessAddressInput) => {
  const street = streetAddress.trim();
  const cityStateZip = `${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`;
  return street ? `${street}, ${cityStateZip}` : cityStateZip;
};

const hasValidSavedCoordinates = (
  latitude?: number | null,
  longitude?: number | null
) =>
  latitude != null &&
  longitude != null &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  !isPlaceholderCoordinate(latitude, longitude);

export const isBusinessUsingDefaultCoordinates = (
  business: Record<string, unknown>
) => {
  const lat = Number(business.latitude ?? business.lat);
  const lng = Number(business.longitude ?? business.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return true;
  }

  return isPlaceholderCoordinate(lat, lng);
};

export type BusinessCoordinatesResult =
  | {
      ok: true;
      address: string;
      latitude: number;
      longitude: number;
      coordinates_exact: true;
    }
  | { ok: false; message: string };

export const logBusinessCreateAddress = (input: BusinessAddressInput) => {
  console.log("BUSINESS_CREATE_ADDRESS", {
    street: input.streetAddress?.trim() || "",
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    zip: input.zipCode.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  });
};

export const logBusinessGeocodeResult = (
  address: string,
  result: { latitude: number; longitude: number } | null,
  source: "autocomplete" | "structured" | "freeform"
) => {
  console.log("BUSINESS_GEOCODE_RESULT", {
    address,
    source,
    latitude: result?.latitude ?? null,
    longitude: result?.longitude ?? null,
    isDefaultFallback: result
      ? isPlaceholderCoordinate(result.latitude, result.longitude)
      : true,
  });
};

export const logBusinessSavedCoordinates = (
  business: Record<string, unknown>
) => {
  const lat = Number(business.latitude ?? business.lat);
  const lng = Number(business.longitude ?? business.lng);

  console.log("BUSINESS_SAVED_COORDINATES", {
    id: business.id,
    name: business.business_name || business.name || business.title,
    street: business.street_address,
    city: business.city,
    state: business.state,
    zip: business.zip_code ?? business.zip,
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    coordinates_exact: business.coordinates_exact === true,
    isDefaultFallback: isBusinessUsingDefaultCoordinates(business),
  });
};

export const logBusinessMapCoordinates = (
  item: DiscoverableListing,
  latitude: number | null,
  longitude: number | null,
  source: "exact" | "legacy_exact" | "fallback" | "skipped" | "geocoded"
) => {
  const record = item as Record<string, unknown>;
  console.log("BUSINESS_MAP_COORDINATES", {
    id: getListingId(item),
    name: item.business_name || item.name || item.title,
    street: record.street_address,
    city: item.city,
    state: item.state,
    zip: record.zip_code ?? record.zip,
    latitude,
    longitude,
    source,
    coordinates_exact: record.coordinates_exact === true,
    isDefaultFallback:
      latitude != null && longitude != null
        ? isPlaceholderCoordinate(latitude, longitude)
        : true,
  });
};

export const logBusinessDirectionsCoordinates = (
  business: Record<string, unknown>,
  query: string | null
) => {
  const isCoordinatePair = Boolean(
    query && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query)
  );

  console.log("BUSINESS_DIRECTIONS_COORDINATES", {
    id: business.id,
    name: business.business_name || business.name || business.title,
    query,
    usesCoordinates: isCoordinatePair,
    coordinates_exact: business.coordinates_exact === true,
  });
};

export const resolveBusinessCoordinatesForSave = async (
  input: BusinessAddressInput
): Promise<BusinessCoordinatesResult> => {
  const address = formatBusinessAddress(input);

  if (hasValidSavedCoordinates(input.latitude, input.longitude)) {
    logBusinessGeocodeResult(address, {
      latitude: input.latitude!,
      longitude: input.longitude!,
    }, "autocomplete");

    return {
      ok: true,
      address,
      latitude: input.latitude!,
      longitude: input.longitude!,
      coordinates_exact: true,
    };
  }

  const structured = await geocodeStructuredAddress({
    streetAddress: input.streetAddress,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    country: "United States",
  });
  logBusinessGeocodeResult(address, structured, "structured");

  let geocoded = structured;
  if (
    !geocoded ||
    isPlaceholderCoordinate(geocoded.latitude, geocoded.longitude)
  ) {
    geocoded = await geocodeAddress(address);
    logBusinessGeocodeResult(address, geocoded, "freeform");
  }

  if (!geocoded || isPlaceholderCoordinate(geocoded.latitude, geocoded.longitude)) {
    return {
      ok: false,
      message:
        "We could not place this address on the map. Select a suggestion from the street address field, or double-check street, city, state, and ZIP.",
    };
  }

  return {
    ok: true,
    address,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    coordinates_exact: true,
  };
};

/** Merge verified location fields from profile_v2 onto discover/map listings. */
export const mergeBusinessProfileLocation = <
  T extends DiscoverableListing,
>(item: T, profile: DiscoverableListing | null | undefined): T => {
  if (!profile) return item;

  const profileRecord = profile as Record<string, unknown>;
  const itemRecord = item as Record<string, unknown>;
  const merged = { ...item } as T & Record<string, unknown>;

  const profileLat = profile.latitude ?? profile.lat;
  const profileLng = profile.longitude ?? profile.lng;

  if (profile.address) merged.address = profile.address;
  if (profileRecord.street_address) {
    merged.street_address = profileRecord.street_address;
  }
  if (profile.city) merged.city = profile.city;
  if (profile.state) merged.state = profile.state;
  if (profileRecord.zip_code || profileRecord.zip) {
    merged.zip_code = profileRecord.zip_code ?? profileRecord.zip;
    merged.zip = profileRecord.zip ?? profileRecord.zip_code;
  }

  if (
    profileLat != null &&
    profileLng != null &&
    hasTrustedBusinessMapCoordinates(profile, Number(profileLat), Number(profileLng))
  ) {
    merged.latitude = profileLat;
    merged.longitude = profileLng;
    merged.lat = profileLat;
    merged.lng = profileLng;
    merged.coordinates_exact = true;
  }

  return merged as T;
};

export const logBusinessLocationSaved = (business: Record<string, unknown>) => {
  logBusinessSavedCoordinates(business);
};

export const getBusinessDirectionsQuery = (
  business: Record<string, unknown>
): string | null => {
  const lat = Number(business.latitude ?? business.lat);
  const lng = Number(business.longitude ?? business.lng);

  let query: string | null = null;

  if (hasTrustedBusinessMapCoordinates(business as DiscoverableListing, lat, lng)) {
    query = `${lat},${lng}`;
  } else {
    query = String(
      business.address ||
        formatBusinessAddress({
          streetAddress: String(business.street_address || ""),
          city: String(business.city || ""),
          state: String(business.state || ""),
          zipCode: String(business.zip_code || business.zip || ""),
        })
    ).trim();
  }

  logBusinessDirectionsCoordinates(business, query || null);
  return query || null;
};
