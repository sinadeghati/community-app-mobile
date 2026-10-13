/**
 * Tahchin Corner (staging listing id 22) — cluster split regression.
 * Run: npx tsx lib/tahchinCornerCluster.test.ts
 */
import {
  STAGING_BANDAR_LISTING,
  STAGING_DOWNTOWN_PLACEHOLDER_LISTING,
  STAGING_TAHCHIN_CORNER_LISTING,
} from "./stagingMapFixtures";
import {
  MAP_CLUSTER_LAT_DELTA,
  buildMapDisplayLite,
  type LiteResolvedMapPoint,
} from "./mapClusterDisplayLite";
import { getMapMarkerKey } from "./mapMarkerKeys";
import { findLostClusterLeafKeys } from "./mapClusterInvariant";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

/** Staging listing 19 — shares a wide-zoom grid cell with Tahchin on the map. */
const STAGING_UPDATED_DEMO = {
  id: 19,
  latitude: 32.8079431,
  longitude: -117.1548935,
};

const toPoint = (
  listing: { id: number; latitude: number; longitude: number },
  index: number
): LiteResolvedMapPoint => ({
  item: { id: listing.id },
  index,
  latitude: listing.latitude,
  longitude: listing.longitude,
  hasExactCoordinate: true,
});

const expandBounds = (
  centerLat: number,
  centerLng: number,
  latitudeDelta: number,
  longitudeDelta: number,
  padding: number
) => {
  const latSpan = latitudeDelta * padding;
  const lngSpan = longitudeDelta * padding;
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

const withinBounds = (
  lat: number,
  lng: number,
  bounds: ReturnType<typeof expandBounds>
) =>
  lat >= bounds.southWest.latitude &&
  lat <= bounds.northEast.latitude &&
  lng >= bounds.southWest.longitude &&
  lng <= bounds.northEast.longitude;

const filterIdsByViewport = (
  points: LiteResolvedMapPoint[],
  centerLat: number,
  centerLng: number,
  latitudeDelta: number,
  longitudeDelta: number,
  padding = 1.35
) => {
  const bounds = expandBounds(
    centerLat,
    centerLng,
    latitudeDelta,
    longitudeDelta,
    padding
  );
  return points.filter((p) =>
    withinBounds(p.latitude, p.longitude, bounds)
  );
};

const tahchin = STAGING_TAHCHIN_CORNER_LISTING;
const wideZoomLatDelta = 0.54;
const tahchinPair = [
  toPoint(
    {
      id: tahchin.id as number,
      latitude: tahchin.latitude!,
      longitude: tahchin.longitude!,
    },
    0
  ),
  toPoint(STAGING_UPDATED_DEMO, 1),
];

const wideDisplay = buildMapDisplayLite(tahchinPair, wideZoomLatDelta);
const tahchinCluster = wideDisplay.find(
  (entry) => entry.type === "cluster" && entry.count === 2
);
assert(
  "wide zoom: Tahchin (22) and listing 19 form cluster of 2",
  tahchinCluster?.type === "cluster" &&
    tahchinCluster.points.some((p) => p.item.id === 22) &&
    tahchinCluster.points.some((p) => p.item.id === 19)
);

const narrowLatDelta = MAP_CLUSTER_LAT_DELTA * 0.5;
const fullInputNarrow = buildMapDisplayLite(tahchinPair, narrowLatDelta);
assert(
  "narrow zoom: both Tahchin cluster leaves render as points when input unchanged",
  fullInputNarrow.length === 2 &&
    fullInputNarrow.every((e) => e.type === "point") &&
    findLostClusterLeafKeys(tahchinPair, fullInputNarrow).length === 0
);

const downtownCenter = {
  lat: STAGING_DOWNTOWN_PLACEHOLDER_LISTING.latitude!,
  lng: STAGING_DOWNTOWN_PLACEHOLDER_LISTING.longitude!,
};
const downtownBounds = expandBounds(
  downtownCenter.lat,
  downtownCenter.lng,
  narrowLatDelta,
  narrowLatDelta,
  1.35
);
assert(
  "Tahchin raw coords outside narrow downtown padded viewport (96ac9c2 bug)",
  !withinBounds(tahchin.latitude!, tahchin.longitude!, downtownBounds)
);
assert(
  "Bandar raw coords inside narrow downtown padded viewport",
  withinBounds(
    STAGING_BANDAR_LISTING.latitude!,
    STAGING_BANDAR_LISTING.longitude!,
    downtownBounds
  )
);

const downtownPair = [
  toPoint(
    {
      id: STAGING_BANDAR_LISTING.id as number,
      latitude: STAGING_BANDAR_LISTING.latitude!,
      longitude: STAGING_BANDAR_LISTING.longitude!,
    },
    0
  ),
  toPoint(
    {
      id: STAGING_DOWNTOWN_PLACEHOLDER_LISTING.id as number,
      latitude: STAGING_DOWNTOWN_PLACEHOLDER_LISTING.latitude!,
      longitude: STAGING_DOWNTOWN_PLACEHOLDER_LISTING.longitude!,
    },
    1
  ),
];

const allStagingPoints = [...tahchinPair, ...downtownPair];
const viewportFiltered = filterIdsByViewport(
  allStagingPoints,
  downtownCenter.lat,
  downtownCenter.lng,
  narrowLatDelta,
  narrowLatDelta
);
const filteredIds = viewportFiltered.map((p) => p.item.id);
assert(
  "viewport pre-filter drops Tahchin (22) when zoomed downtown",
  !filteredIds.includes(22) && filteredIds.includes(25) && filteredIds.includes(23)
);

const clusterInputAfterBadFilter = viewportFiltered;
const wideClusterAtDowntown = buildMapDisplayLite(clusterInputAfterBadFilter, 0.22);
const clusterTwo = wideClusterAtDowntown.find(
  (e) => e.type === "cluster" && e.count === 2
);
assert(
  "after viewport filter, downtown still shows cluster of 2 (bandar + QA)",
  clusterTwo?.type === "cluster"
);

const fullInputWide = buildMapDisplayLite(allStagingPoints, wideZoomLatDelta);
const tahchinInWideDisplay = fullInputWide.some(
  (e) =>
    (e.type === "cluster" && e.points.some((p) => p.item.id === 22)) ||
    (e.type === "point" && e.point.item.id === 22)
);
assert(
  "full clustering input still includes Tahchin at wider zoom",
  tahchinInWideDisplay
);

const lostAfterViewportFilter = buildMapDisplayLite(
  clusterInputAfterBadFilter,
  narrowLatDelta
);
assert(
  "viewport-filtered pipeline cannot render Tahchin after zoom-in split",
  !lostAfterViewportFilter.some(
    (e) =>
      (e.type === "point" && e.point.item.id === 22) ||
      (e.type === "cluster" &&
        e.points.some((p) => p.item.id === 22))
  )
);

for (const delta of [0.22, 0.14, 0.08, 0.05, 0.22]) {
  const built = buildMapDisplayLite(downtownPair, delta);
  const lost = findLostClusterLeafKeys(downtownPair, built);
  assert(`downtown pair zoom delta ${delta} accounts for all ids`, lost.length === 0);
}

for (const delta of [wideZoomLatDelta, 0.6, narrowLatDelta, 0.22, wideZoomLatDelta]) {
  const built = buildMapDisplayLite(tahchinPair, delta);
  const lost = findLostClusterLeafKeys(tahchinPair, built, getMapMarkerKey);
  assert(`tahchin pair zoom delta ${delta} accounts for all ids`, lost.length === 0);
}

console.log("tahchinCornerCluster tests passed");
