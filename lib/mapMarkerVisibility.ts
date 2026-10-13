import type { Region } from "react-native-maps";
import type { AppLocationBounds } from "./appLocation";
import { isWithinBounds } from "./activeLocationFilter";
import type { DiscoverableListing } from "./discoverableListings";
import {
  isMapRegionTooWideForNearby,
  resolveMapPoints,
  type ResolvedMapPoint,
} from "./mapCoordinates";
import { regionToBounds } from "./appLocation";

export const MAP_MARKER_BOUNDS_PADDING = 1.35;

export const expandMapBounds = (
  bounds: AppLocationBounds,
  paddingFactor = MAP_MARKER_BOUNDS_PADDING
): AppLocationBounds => {
  const latSpan =
    (bounds.northEast.latitude - bounds.southWest.latitude) * paddingFactor;
  const lngSpan =
    (bounds.northEast.longitude - bounds.southWest.longitude) * paddingFactor;
  const centerLat =
    (bounds.northEast.latitude + bounds.southWest.latitude) / 2;
  const centerLng =
    (bounds.northEast.longitude + bounds.southWest.longitude) / 2;

  return {
    northEast: {
      latitude: centerLat + latSpan / 2,
      longitude: centerLng + lngSpan / 2,
    },
    southWest: {
      latitude: centerLat - latSpan / 2,
      longitude: centerLng - lngSpan / 2,
    },
  };
};

export const buildResolvedMapPointIndex = (
  items: DiscoverableListing[]
): Map<string, ResolvedMapPoint> => {
  const index = new Map<string, ResolvedMapPoint>();
  resolveMapPoints(items).forEach((point) => {
    const id = String(point.item?.id ?? "");
    if (id) index.set(id, point);
  });
  return index;
};

export const listingPointWithinMapRegion = (
  point: ResolvedMapPoint,
  region: Region,
  paddingFactor = MAP_MARKER_BOUNDS_PADDING
): boolean => {
  if (isMapRegionTooWideForNearby(region)) return false;
  const bounds = expandMapBounds(regionToBounds(region), paddingFactor);
  return isWithinBounds(point.latitude, point.longitude, bounds);
};

export const filterItemsForMapMarkers = (
  items: DiscoverableListing[],
  region: Region,
  pointIndex: Map<string, ResolvedMapPoint>
): DiscoverableListing[] => {
  if (isMapRegionTooWideForNearby(region)) return [];

  return items.filter((item) => {
    const id = String(item?.id ?? "");
    const point = pointIndex.get(id) ?? resolveMapPoints([item])[0];
    if (!point) return false;
    return listingPointWithinMapRegion(point, region);
  });
};
