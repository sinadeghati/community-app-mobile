import type { Region } from "react-native-maps";
import { getMapMarkerKey } from "./mapMarkers";
import {
  collectRenderedMarkerKeys,
  normalizeMapDisplayClusters,
} from "./mapRegionGesture";
import { buildMapDisplay, resolveMapPoints } from "./mapCoordinates";
import {
  filterItemsForMapMarkers,
  buildResolvedMapPointIndex,
} from "./mapMarkerVisibility";
import { findLostClusterLeafKeys } from "./mapClusterInvariant";
import type { DiscoverableListing } from "./discoverableListings";
import { getListingId, isEventListing } from "./discoverableListings";

export type MapPipelineTrace = {
  seq: number;
  loadGeneration: number;
  region: Pick<Region, "latitude" | "longitude" | "latitudeDelta" | "longitudeDelta">;
  storedIds: string[];
  markerEligibleIds: string[];
  clusterInputIds: string[];
  renderedKeys: string[];
  missingFromRender: string[];
  clusterInvariantMissing: string[];
};

let traceSeq = 0;

export const traceMapMarkerPipeline = (
  items: DiscoverableListing[],
  region: Region,
  loadGeneration: number
): MapPipelineTrace => {
  const seq = ++traceSeq;
  const storedIds = items.map((item) => getListingId(item)).filter(Boolean);
  const pointIndex = buildResolvedMapPointIndex(items);
  const markerItems = filterItemsForMapMarkers(items, region, pointIndex);
  const markerEligibleIds = markerItems.map((item) => getListingId(item));
  const clusterInputPoints = resolveMapPoints(items);
  const clusterInputIds = clusterInputPoints.map((point) =>
    getMapMarkerKey(point.item)
  );
  const viewportOnlyIds = markerEligibleIds;
  const built = buildMapDisplay(clusterInputPoints, region, { gateTooWide: false });
  const normalized = normalizeMapDisplayClusters(built, (item) =>
    getMapMarkerKey(item as DiscoverableListing)
  );
  const renderedKeys = Array.from(
    collectRenderedMarkerKeys(normalized, (item) =>
      getMapMarkerKey(item as DiscoverableListing)
    )
  );
  const renderedIdSet = new Set(renderedKeys);
  const missingFromRender = clusterInputIds.filter((key) => !renderedIdSet.has(key));
  const clusterInvariantMissing = findLostClusterLeafKeys(
    clusterInputPoints,
    normalized
  );

  const trace: MapPipelineTrace = {
    seq,
    loadGeneration,
    region: {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    },
    storedIds,
    markerEligibleIds: viewportOnlyIds,
    clusterInputIds,
    renderedKeys,
    missingFromRender,
    clusterInvariantMissing,
  };

  if (__DEV__ && (missingFromRender.length > 0 || clusterInvariantMissing.length > 0)) {
    console.log("[map-trace] marker pipeline loss", trace);
  }

  return trace;
};

export const logMapPipelineStage = (
  stage: string,
  payload: Record<string, unknown>
) => {
  if (!__DEV__) return;
  console.log(`[map-trace] ${stage}`, payload);
};

export const splitBusinessEventIds = (ids: string[], items: DiscoverableListing[]) => {
  const businesses: string[] = [];
  const events: string[] = [];
  const byId = new Map(items.map((item) => [getListingId(item), item]));
  ids.forEach((id) => {
    const item = byId.get(id);
    if (!item) return;
    if (isEventListing(item)) events.push(id);
    else businesses.push(id);
  });
  return { businesses, events };
};
