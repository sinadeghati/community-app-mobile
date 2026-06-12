import type { Region } from "react-native-maps";
import {
  hasGeocodableBusinessAddress,
  hasTrustedBusinessMapCoordinates,
  logBusinessMapCoordinates,
} from "./businessLocation";
import type { DiscoverableListing } from "./discoverableListings";
import { getListingId, isEventListing } from "./discoverableListings";

const SAN_DIEGO_CENTER = {
  latitude: 32.7157,
  longitude: -117.1611,
};

/** Zoomed-out threshold — cluster when latitude span is wider than this. */
export const MAP_CLUSTER_LAT_DELTA = 0.1;

/**
 * Safe camera span limits — prevents extreme zoom-out tile collapse on MapView.
 * ~8° latitude ≈ 550+ mi; enough for metro discovery without world-scale deltas.
 */
export const MAP_REGION_LIMITS = {
  minLatitudeDelta: 0.006,
  maxLatitudeDelta: 8,
  minLongitudeDelta: 0.006,
  maxLongitudeDelta: 8,
} as const;

/** Native map zoom floor — blocks pinch zoom-out past a multi-metro level. */
export const MAP_MIN_ZOOM_LEVEL = 4;

const isValidMapDelta = (value: number) => Number.isFinite(value) && value > 0;

export const regionExceedsMapLimits = (region: Region): boolean => {
  if (
    !isValidMapDelta(region.latitudeDelta) ||
    !isValidMapDelta(region.longitudeDelta)
  ) {
    return true;
  }

  return (
    region.latitudeDelta < MAP_REGION_LIMITS.minLatitudeDelta ||
    region.latitudeDelta > MAP_REGION_LIMITS.maxLatitudeDelta ||
    region.longitudeDelta < MAP_REGION_LIMITS.minLongitudeDelta ||
    region.longitudeDelta > MAP_REGION_LIMITS.maxLongitudeDelta
  );
};

export const clampMapRegion = (region: Region): Region => {
  let latitudeDelta = region.latitudeDelta;
  let longitudeDelta = region.longitudeDelta;

  if (!isValidMapDelta(latitudeDelta)) {
    latitudeDelta = 0.18;
  }
  if (!isValidMapDelta(longitudeDelta)) {
    longitudeDelta = 0.18;
  }

  latitudeDelta = Math.min(
    MAP_REGION_LIMITS.maxLatitudeDelta,
    Math.max(MAP_REGION_LIMITS.minLatitudeDelta, latitudeDelta)
  );
  longitudeDelta = Math.min(
    MAP_REGION_LIMITS.maxLongitudeDelta,
    Math.max(MAP_REGION_LIMITS.minLongitudeDelta, longitudeDelta)
  );

  const latitude = Math.min(85, Math.max(-85, region.latitude));
  let longitude = region.longitude;
  if (!Number.isFinite(longitude)) {
    longitude = SAN_DIEGO_CENTER.longitude;
  }

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

/** Backend/listings often default to downtown San Diego — not real business coords. */
const PLACEHOLDER_COORDINATES = [{ latitude: 32.7157, longitude: -117.1611 }];

/** Approximate city centers for San Diego County (temporary until geocoding). */
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  escondido: { latitude: 33.1192, longitude: -117.0864 },
  "san diego": { latitude: 32.7157, longitude: -117.1611 },
  "chula vista": { latitude: 32.6401, longitude: -117.0842 },
  "la mesa": { latitude: 32.7678, longitude: -117.0231 },
  "el cajon": { latitude: 32.7948, longitude: -116.9625 },
  carlsbad: { latitude: 33.1581, longitude: -117.3506 },
  oceanside: { latitude: 33.1959, longitude: -117.3795 },
  vista: { latitude: 33.2000, longitude: -117.2425 },
  poway: { latitude: 32.9628, longitude: -117.0359 },
  "national city": { latitude: 32.6781, longitude: -117.0992 },
  "la jolla": { latitude: 32.8328, longitude: -117.2713 },
  encinitas: { latitude: 33.037, longitude: -117.292 },
  santee: { latitude: 32.8384, longitude: -116.9739 },
  delmar: { latitude: 32.9595, longitude: -117.2653 },
};

const CITY_MATCHERS = Object.keys(CITY_COORDINATES).sort(
  (a, b) => b.length - a.length
);

const titleCaseCityLabel = (cityKey: string) =>
  cityKey.replace(/\b\w/g, (letter) => letter.toUpperCase());

export const DEFAULT_CITY_LABEL = "San Diego";

export const getSupportedCityLabels = (): string[] => {
  const labels = Object.keys(CITY_COORDINATES).map(titleCaseCityLabel);
  return labels.sort((a, b) => {
    if (a === DEFAULT_CITY_LABEL) return -1;
    if (b === DEFAULT_CITY_LABEL) return 1;
    return a.localeCompare(b);
  });
};

export const getMapRegionForCity = (cityLabel: string): Region => {
  const key = cityLabel.trim().toLowerCase();
  const center = CITY_COORDINATES[key] ?? SAN_DIEGO_CENTER;

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
  };
};

/** County anchors used when no city can be parsed (avoids one downtown pile-up). */
const COUNTY_FALLBACK_CITY_KEYS = CITY_MATCHERS.filter((key) => key !== "san diego");

const ZIP_TO_CITY: Record<string, string> = {
  "91910": "chula vista",
  "91911": "chula vista",
  "91913": "chula vista",
  "91914": "chula vista",
  "91915": "chula vista",
  "91941": "la mesa",
  "91942": "la mesa",
  "91943": "la mesa",
  "91944": "la mesa",
  "91945": "la mesa",
  "92020": "el cajon",
  "92021": "el cajon",
  "92025": "escondido",
  "92026": "escondido",
  "92027": "escondido",
  "92029": "escondido",
  "92037": "la jolla",
  "92054": "oceanside",
  "92056": "oceanside",
  "92057": "oceanside",
  "92064": "poway",
  "92067": "rancho santa fe",
  "92071": "santee",
  "92101": "san diego",
  "92102": "san diego",
  "92103": "san diego",
  "92104": "san diego",
  "92105": "san diego",
  "92115": "san diego",
  "92116": "san diego",
  "92122": "san diego",
  "92123": "san diego",
  "92130": "del mar",
  "92131": "san diego",
  "92154": "san diego",
};

export type ResolvedMapPoint = {
  item: DiscoverableListing;
  index: number;
  latitude: number;
  longitude: number;
  hasExactCoordinate: boolean;
};

export type MapMarkerDisplay =
  | { type: "point"; point: ResolvedMapPoint }
  | {
      type: "cluster";
      id: string;
      latitude: number;
      longitude: number;
      count: number;
      points: ResolvedMapPoint[];
    };

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getMapLat = (item: DiscoverableListing) => {
  const raw = item.latitude ?? item.lat;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const getMapLng = (item: DiscoverableListing) => {
  const raw = item.longitude ?? item.lng;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const jitterFromId = (id: string, spread = 1) => {
  const hash = hashString(id);
  return {
    dLat: (((hash % 40) - 20) / 8000) * spread,
    dLng: (((Math.floor(hash / 40) % 40) - 20) / 8000) * spread,
  };
};

const getLocationTextForCity = (item: DiscoverableListing) =>
  [
    item.address,
    item.city,
    item.state,
    item.description,
    item.about,
    item.business_name,
    item.name,
    item.title,
  ]
    .filter((value) => value != null && String(value).trim() !== "")
    .join(" ")
    .toLowerCase();

const parseCityFromZip = (text: string) => {
  const matches = text.match(/\b9[0-2]\d{3}\b/g);
  if (!matches) return null;

  for (const zip of matches) {
    const cityKey = ZIP_TO_CITY[zip];
    if (cityKey && CITY_COORDINATES[cityKey]) return cityKey;
  }

  return null;
};

/** Parse a known San Diego–area city from address/city/zip text. */
export const parseCityKey = (item: DiscoverableListing): string | null => {
  const text = getLocationTextForCity(item);
  if (!text) return null;

  for (const cityKey of CITY_MATCHERS) {
    if (text.includes(cityKey)) return cityKey;
  }

  return parseCityFromZip(text);
};

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

const isNearDowntown = (latitude: number, longitude: number, maxKm = 5) =>
  distanceKm(latitude, longitude, SAN_DIEGO_CENTER.latitude, SAN_DIEGO_CENTER.longitude) <=
  maxKm;

const pickCountyFallbackCityKey = (item: DiscoverableListing) => {
  const hash = hashString(getListingId(item));
  return COUNTY_FALLBACK_CITY_KEYS[hash % COUNTY_FALLBACK_CITY_KEYS.length];
};

export const isPlaceholderCoordinate = (latitude: number, longitude: number) =>
  PLACEHOLDER_COORDINATES.some(
    (point) =>
      Math.abs(point.latitude - latitude) < 0.002 &&
      Math.abs(point.longitude - longitude) < 0.002
  );

const coordinatesMatchCity = (
  latitude: number,
  longitude: number,
  cityKey: string,
  maxKm = 22
) => {
  const city = CITY_COORDINATES[cityKey];
  if (!city) return true;

  return distanceKm(latitude, longitude, city.latitude, city.longitude) <= maxKm;
};

/**
 * City-level fallback when lat/lng are missing, placeholder, or contradict address.
 * Spreads markers slightly within the city so they do not stack.
 */
export const getCityFallbackCoordinate = (item: DiscoverableListing) => {
  const cityKey = parseCityKey(item) ?? pickCountyFallbackCityKey(item);
  const base = CITY_COORDINATES[cityKey] ?? SAN_DIEGO_CENTER;
  const jitter = jitterFromId(getListingId(item), 2.5);

  return {
    latitude: base.latitude + jitter.dLat,
    longitude: base.longitude + jitter.dLng,
    cityKey,
  };
};

export const shouldUseExactCoordinates = (
  item: DiscoverableListing,
  latitude: number,
  longitude: number
) => {
  const coordinatesExact = (item as Record<string, unknown>).coordinates_exact;
  if (coordinatesExact === true) {
    return !isPlaceholderCoordinate(latitude, longitude);
  }
  if (coordinatesExact === false) {
    return false;
  }

  if (isPlaceholderCoordinate(latitude, longitude)) return false;

  const cityKey = parseCityKey(item);
  if (!cityKey) {
    return !isNearDowntown(latitude, longitude, 6);
  }

  if (!coordinatesMatchCity(latitude, longitude, cityKey)) return false;

  if (cityKey !== "san diego" && isNearDowntown(latitude, longitude, 4)) {
    return false;
  }

  return true;
};

/** Resolve lat/lng from listing fields; spread duplicates; city fallback when needed. */
export function resolveMapPoints(items: DiscoverableListing[]): ResolvedMapPoint[] {
  const coordCounts = new Map<string, number>();

  items.forEach((item) => {
    const lat = getMapLat(item);
    const lng = getMapLng(item);
    if (
      lat != null &&
      lng != null &&
      shouldUseExactCoordinates(item, lat, lng)
    ) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
    }
  });

  return items.flatMap((item, index) => {
    const lat = getMapLat(item);
    const lng = getMapLng(item);
    const isBusiness = !isEventListing(item);

    const trustedBusinessCoords =
      isBusiness &&
      lat != null &&
      lng != null &&
      hasTrustedBusinessMapCoordinates(item, lat, lng);

    if (trustedBusinessCoords) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const isDuplicate = (coordCounts.get(key) || 0) > 1;
      const jitter = isDuplicate ? jitterFromId(getListingId(item)) : { dLat: 0, dLng: 0 };
      const latitude = lat + jitter.dLat;
      const longitude = lng + jitter.dLng;

      logBusinessMapCoordinates(
        item,
        latitude,
        longitude,
        (item as Record<string, unknown>).coordinates_exact === true
          ? "exact"
          : "legacy_exact"
      );

      return [
        {
          item,
          index,
          latitude,
          longitude,
          hasExactCoordinate: true,
        },
      ];
    }

    if (
      !isBusiness &&
      lat != null &&
      lng != null &&
      shouldUseExactCoordinates(item, lat, lng)
    ) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const isDuplicate = (coordCounts.get(key) || 0) > 1;
      const jitter = isDuplicate ? jitterFromId(getListingId(item)) : { dLat: 0, dLng: 0 };

      return [
        {
          item,
          index,
          latitude: lat + jitter.dLat,
          longitude: lng + jitter.dLng,
          hasExactCoordinate: true,
        },
      ];
    }

    if (isEventListing(item)) {
      const fallback = getCityFallbackCoordinate(item);
      return [
        {
          item,
          index,
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          hasExactCoordinate: false,
        },
      ];
    }

    if (isBusiness && hasGeocodableBusinessAddress(item)) {
      const fallback = getCityFallbackCoordinate(item);
      logBusinessMapCoordinates(
        item,
        fallback.latitude,
        fallback.longitude,
        "fallback_pending_geocode"
      );
      return [
        {
          item,
          index,
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          hasExactCoordinate: false,
        },
      ];
    }

    const fallback = getCityFallbackCoordinate(item);
    if (isBusiness) {
      logBusinessMapCoordinates(
        item,
        fallback.latitude,
        fallback.longitude,
        "fallback"
      );
    }

    return [
      {
        item,
        index,
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        hasExactCoordinate: false,
      },
    ];
  });
}

/** Lightweight grid clustering when the map is zoomed out. */
export function buildMapDisplay(
  points: ResolvedMapPoint[],
  region: Pick<Region, "latitudeDelta" | "longitudeDelta">
): MapMarkerDisplay[] {
  if (points.length === 0) return [];

  if (region.latitudeDelta <= MAP_CLUSTER_LAT_DELTA) {
    return points.map((point) => ({ type: "point", point }));
  }

  const cellSize = Math.max(region.latitudeDelta / 5, 0.018);
  const buckets = new Map<string, ResolvedMapPoint[]>();

  points.forEach((point) => {
    const latCell = Math.floor(point.latitude / cellSize);
    const lngCell = Math.floor(point.longitude / cellSize);
    const key = `${latCell}:${lngCell}`;
    const group = buckets.get(key) || [];
    group.push(point);
    buckets.set(key, group);
  });

  const display: MapMarkerDisplay[] = [];

  buckets.forEach((group, key) => {
    if (group.length < 2) {
      display.push({ type: "point", point: group[0] });
      return;
    }

    const latitude =
      group.reduce((sum, point) => sum + point.latitude, 0) / group.length;
    const longitude =
      group.reduce((sum, point) => sum + point.longitude, 0) / group.length;

    display.push({
      type: "cluster",
      id: key,
      latitude,
      longitude,
      count: group.length,
      points: group,
    });
  });

  return display;
}

export const regionForMapPoints = (
  points: ResolvedMapPoint[],
  options?: { latOffset?: number; minDelta?: number; paddingFactor?: number }
): Region | null => {
  if (points.length === 0) return null;

  const latOffset = options?.latOffset ?? 0.012;
  const minDelta = options?.minDelta ?? 0.055;
  const paddingFactor = options?.paddingFactor ?? 1.6;

  if (points.length === 1) {
    const point = points[0];
    return clampMapRegion({
      latitude: point.latitude - latOffset,
      longitude: point.longitude,
      latitudeDelta: minDelta,
      longitudeDelta: minDelta,
    });
  }

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latitudeDelta = Math.max((maxLat - minLat) * paddingFactor, minDelta);
  const longitudeDelta = Math.max((maxLng - minLng) * paddingFactor, minDelta);

  return clampMapRegion({
    latitude: (minLat + maxLat) / 2 - latOffset * 0.5,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  });
};

export const regionForCluster = (
  cluster: Extract<MapMarkerDisplay, { type: "cluster" }>
): Region => {
  const lats = cluster.points.map((point) => point.latitude);
  const lngs = cluster.points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latitudeDelta = Math.max((maxLat - minLat) * 1.8, 0.035);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.8, 0.035);

  return clampMapRegion({
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  });
};
