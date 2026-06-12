import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import type { Region } from "react-native-maps";
import { DeviceEventEmitter } from "react-native";
import { withTimeout } from "./asyncGuards";
import {
  DEFAULT_CURRENT_RADIUS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
} from "./activeLocationFilter";

export const APP_LOCATION_CHANGED_EVENT = "app_location_changed_v1";
export const ACTIVE_LOCATION_STORAGE_KEY = "app_active_location_v3";

export type LocationSource = "current" | "search" | "viewport";

export type AppLocationCoordinates = {
  latitude: number;
  longitude: number;
};

export type AppLocationBounds = {
  northEast: AppLocationCoordinates;
  southWest: AppLocationCoordinates;
};

export type AppLocationMapDelta = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type AppLocationState = {
  source: LocationSource;
  regionLabel: string;
  coordinates: AppLocationCoordinates;
  radiusKm: number | null;
  bounds: AppLocationBounds | null;
  mapDelta: AppLocationMapDelta | null;
  locationKey: string;
};

export type DetectCurrentLocationResult =
  | { ok: true; state: AppLocationState }
  | {
      ok: false;
      reason: "permission_denied" | "unavailable";
    };

const DEFAULT_CENTER: AppLocationCoordinates = {
  latitude: 32.7157,
  longitude: -117.1611,
};

export const DEFAULT_APP_LOCATION: AppLocationState = {
  source: "search",
  regionLabel: "San Diego, California",
  coordinates: DEFAULT_CENTER,
  radiusKm: DEFAULT_SEARCH_RADIUS_KM,
  bounds: null,
  mapDelta: { latitudeDelta: 0.18, longitudeDelta: 0.18 },
  locationKey: "default",
};

const LEGACY_SOURCE_KEY = "app_location_source_v1";
const LEGACY_COORDS_KEY = "explore_current_coords_v1";
const LEGACY_LABEL_KEY = "explore_selected_location_v1";

const nextLocationKey = () => `loc-${Date.now()}`;

const emitAppLocationChanged = () => {
  DeviceEventEmitter.emit(APP_LOCATION_CHANGED_EVENT);
};

const parseStoredState = (raw: string | null): AppLocationState | null => {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AppLocationState>;
    const { latitude, longitude } = parsed.coordinates ?? {};
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      source:
        parsed.source === "current" ||
        parsed.source === "search" ||
        parsed.source === "viewport"
          ? parsed.source
          : "search",
      regionLabel: String(parsed.regionLabel || DEFAULT_APP_LOCATION.regionLabel),
      coordinates: { latitude: latitude!, longitude: longitude! },
      radiusKm:
        parsed.radiusKm == null ? DEFAULT_SEARCH_RADIUS_KM : parsed.radiusKm,
      bounds: parsed.bounds ?? null,
      mapDelta: parsed.mapDelta ?? null,
      locationKey: String(parsed.locationKey || nextLocationKey()),
    };
  } catch {
    return null;
  }
};

const migrateLegacyLocation = async (): Promise<AppLocationState | null> => {
  const [sourceRaw, labelRaw, coordsRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_SOURCE_KEY),
    AsyncStorage.getItem(LEGACY_LABEL_KEY),
    AsyncStorage.getItem(LEGACY_COORDS_KEY),
  ]);

  if (!sourceRaw && !labelRaw && !coordsRaw) return null;

  let coordinates = DEFAULT_CENTER;
  try {
    if (coordsRaw) {
      const parsed = JSON.parse(coordsRaw) as AppLocationCoordinates;
      if (
        Number.isFinite(parsed.latitude) &&
        Number.isFinite(parsed.longitude)
      ) {
        coordinates = parsed;
      }
    }
  } catch {
    // keep default center
  }

  const source: LocationSource =
    sourceRaw === "current" ? "current" : "search";

  return {
    source,
    regionLabel: labelRaw?.trim() || DEFAULT_APP_LOCATION.regionLabel,
    coordinates,
    radiusKm:
      source === "current" ? DEFAULT_CURRENT_RADIUS_KM : DEFAULT_SEARCH_RADIUS_KM,
    bounds: null,
    mapDelta: { latitudeDelta: 0.18, longitudeDelta: 0.18 },
    locationKey: nextLocationKey(),
  };
};

const persistAppLocationState = async (state: AppLocationState) => {
  await AsyncStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, JSON.stringify(state));
  emitAppLocationChanged();
};

export const getLocationBarLabel = (state: AppLocationState): string => {
  if (state.source === "current") {
    return `Current Location · ${state.regionLabel}`;
  }
  if (state.source === "viewport") {
    return `Map Area · ${state.regionLabel}`;
  }
  return state.regionLabel;
};

export const loadAppLocationState = async (): Promise<AppLocationState> => {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_LOCATION_STORAGE_KEY);
    const parsed = parseStoredState(stored);
    if (parsed) return parsed;

    const migrated = await migrateLegacyLocation();
    if (migrated) {
      await persistAppLocationState(migrated);
      return migrated;
    }
  } catch {
    // fall through
  }

  return DEFAULT_APP_LOCATION;
};

export const saveSearchAppLocation = async (
  regionLabel: string,
  coordinates: AppLocationCoordinates,
  options?: {
    radiusKm?: number;
    mapDelta?: AppLocationMapDelta;
  }
): Promise<AppLocationState> => {
  const state: AppLocationState = {
    source: "search",
    regionLabel: regionLabel.trim() || DEFAULT_APP_LOCATION.regionLabel,
    coordinates,
    radiusKm: options?.radiusKm ?? DEFAULT_SEARCH_RADIUS_KM,
    bounds: null,
    mapDelta: options?.mapDelta ?? {
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    },
    locationKey: nextLocationKey(),
  };

  await persistAppLocationState(state);
  return state;
};

export const saveViewportAppLocation = async (
  regionLabel: string,
  bounds: AppLocationBounds,
  coordinates: AppLocationCoordinates,
  mapDelta: AppLocationMapDelta
): Promise<AppLocationState> => {
  const state: AppLocationState = {
    source: "viewport",
    regionLabel: regionLabel.trim() || "Selected map area",
    coordinates,
    radiusKm: null,
    bounds,
    mapDelta,
    locationKey: nextLocationKey(),
  };

  await persistAppLocationState(state);
  return state;
};

const formatReverseGeocodeLabel = (
  place: Location.LocationGeocodedAddress
): string => {
  const parts = [
    place.city || place.district || place.subregion,
    place.region,
    place.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.join(", ") || "Current Location";
};

const resolveLabelAtCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    const place = places[0];
    if (place) {
      return formatReverseGeocodeLabel(place);
    }
  } catch (error) {
    console.log("Reverse geocode error:", error);
  }

  return "Current Location";
};

let detectLocationInFlight: Promise<DetectCurrentLocationResult> | null = null;
let detectLocationCachedAt = 0;
let detectLocationCachedResult: DetectCurrentLocationResult | null = null;
const DETECT_LOCATION_TTL_MS = 120_000;

export const detectCurrentAppLocation =
  async (): Promise<DetectCurrentLocationResult> => {
    const now = Date.now();
    if (
      detectLocationCachedResult?.ok &&
      now - detectLocationCachedAt < DETECT_LOCATION_TTL_MS
    ) {
      return detectLocationCachedResult;
    }

    if (detectLocationInFlight) {
      return detectLocationInFlight;
    }

    detectLocationInFlight = (async (): Promise<DetectCurrentLocationResult> => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return { ok: false, reason: "permission_denied" };
        }

        const position = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          8000,
          "detectCurrentAppLocation.getCurrentPosition",
          null as Location.LocationObject | null
        );

        if (!position) {
          return { ok: false, reason: "unavailable" };
        }

        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return { ok: false, reason: "unavailable" };
        }

        const regionLabel = await resolveLabelAtCoordinates(latitude, longitude);

        const state: AppLocationState = {
          source: "current",
          regionLabel,
          coordinates: { latitude, longitude },
          radiusKm: DEFAULT_CURRENT_RADIUS_KM,
          bounds: null,
          mapDelta: { latitudeDelta: 0.06, longitudeDelta: 0.06 },
          locationKey: nextLocationKey(),
        };

        await persistAppLocationState(state);

        const success = { ok: true as const, state };
        detectLocationCachedResult = success;
        detectLocationCachedAt = Date.now();
        return success;
      } catch (error) {
        console.log("Current location detection error:", error);
        return { ok: false as const, reason: "unavailable" as const };
      } finally {
        detectLocationInFlight = null;
      }
    })();

    return detectLocationInFlight;
  };

/**
 * First-session location: prefer GPS when available, avoid stale legacy city picks.
 * Saved v3 state (explicit user choice) is always respected.
 */
export const bootstrapAppLocation = async (): Promise<AppLocationState> => {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_LOCATION_STORAGE_KEY);
    const parsed = parseStoredState(stored);
    if (parsed) {
      if (parsed.source === "current") {
        const refreshed = await detectCurrentAppLocation();
        if (refreshed.ok) return refreshed.state;
      }
      return parsed;
    }

    const current = await detectCurrentAppLocation();
    if (current.ok) return current.state;

    const migrated = await migrateLegacyLocation();
    if (migrated?.source === "current") {
      await persistAppLocationState(migrated);
      return migrated;
    }
  } catch {
    // fall through
  }

  return DEFAULT_APP_LOCATION;
};

export const regionToMapCenter = (
  state: AppLocationState
): AppLocationCoordinates => state.coordinates;

export const regionToBounds = (region: Region): AppLocationBounds => ({
  northEast: {
    latitude: region.latitude + region.latitudeDelta / 2,
    longitude: region.longitude + region.longitudeDelta / 2,
  },
  southWest: {
    latitude: region.latitude - region.latitudeDelta / 2,
    longitude: region.longitude - region.longitudeDelta / 2,
  },
});

export const boundsToRegion = (
  bounds: AppLocationBounds,
  mapDelta?: AppLocationMapDelta | null
): Region => {
  const latitude =
    (bounds.northEast.latitude + bounds.southWest.latitude) / 2;
  const longitude =
    (bounds.northEast.longitude + bounds.southWest.longitude) / 2;
  const latitudeDelta =
    mapDelta?.latitudeDelta ??
    Math.max(
      (bounds.northEast.latitude - bounds.southWest.latitude) * 1.1,
      0.02
    );
  const longitudeDelta =
    mapDelta?.longitudeDelta ??
    Math.max(
      (bounds.northEast.longitude - bounds.southWest.longitude) * 1.1,
      0.02
    );

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const regionFromAppLocationState = (state: AppLocationState): Region => {
  if (state.source === "viewport" && state.bounds) {
    return boundsToRegion(state.bounds, state.mapDelta);
  }

  const delta = state.mapDelta ?? {
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
  };

  return {
    latitude: state.coordinates.latitude,
    longitude: state.coordinates.longitude,
    latitudeDelta: delta.latitudeDelta,
    longitudeDelta: delta.longitudeDelta,
  };
};
