/**
 * Run: npx tsx lib/mapClusterLogic.test.ts
 * Lightweight cluster math (no react-native imports).
 */
const MAP_CLUSTER_LAT_DELTA = 0.1;

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

type Point = { id: string; latitude: number; longitude: number };

const buildDisplay = (
  points: Point[],
  latitudeDelta: number
): { points: Point[]; clusters: { count: number; ids: string[] }[] } => {
  if (latitudeDelta <= MAP_CLUSTER_LAT_DELTA) {
    return { points, clusters: [] };
  }

  const cellSize = Math.max(latitudeDelta / 5, 0.018);
  const buckets = new Map<string, Point[]>();

  points.forEach((point) => {
    const latCell = Math.floor(point.latitude / cellSize);
    const lngCell = Math.floor(point.longitude / cellSize);
    const key = `${latCell}:${lngCell}`;
    const group = buckets.get(key) || [];
    group.push(point);
    buckets.set(key, group);
  });

  const singles: Point[] = [];
  const clusters: { count: number; ids: string[] }[] = [];

  buckets.forEach((group) => {
    if (group.length < 2) {
      singles.push(group[0]);
      return;
    }
    clusters.push({
      count: group.length,
      ids: group.map((p) => p.id),
    });
  });

  return { points: singles, clusters };
};

const collectAllIds = (result: ReturnType<typeof buildDisplay>) => {
  const ids = new Set<string>();
  result.points.forEach((p) => ids.add(p.id));
  result.clusters.forEach((c) => c.ids.forEach((id) => ids.add(id)));
  return ids;
};

const fixtures: Point[] = [
  { id: "business-1", latitude: 32.715, longitude: -117.161 },
  { id: "business-2", latitude: 32.716, longitude: -117.162 },
  { id: "event-1", latitude: 32.717, longitude: -117.163 },
  { id: "event-2", latitude: 32.718, longitude: -117.164 },
];

const zoomedIn = buildDisplay(fixtures, MAP_CLUSTER_LAT_DELTA * 0.5);
assert("zoomed in keeps four individuals", zoomedIn.points.length === 4);

const zoomedOut = buildDisplay(fixtures, 0.35);
assert(
  "zoomed out still represents every id",
  collectAllIds(zoomedOut).size === 4
);

const zoomedInAgain = buildDisplay(fixtures, MAP_CLUSTER_LAT_DELTA * 0.5);
assert(
  "zoom in again restores individuals",
  zoomedInAgain.points.length === zoomedIn.points.length
);

console.log("mapClusterLogic tests passed");
