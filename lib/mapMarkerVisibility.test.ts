/**
 * Run: npx tsx lib/mapMarkerVisibility.test.ts
 */
const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const expandMapBounds = (
  bounds: {
    northEast: { latitude: number; longitude: number };
    southWest: { latitude: number; longitude: number };
  },
  paddingFactor: number
) => {
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

const bounds = expandMapBounds(
  {
    northEast: { latitude: 33, longitude: -117 },
    southWest: { latitude: 32, longitude: -118 },
  },
  1.35
);

assert("expanded bounds widen latitude span", bounds.northEast.latitude > 33);
assert("expanded bounds widen longitude span", bounds.northEast.longitude > -117);

console.log("mapMarkerVisibility tests passed");
