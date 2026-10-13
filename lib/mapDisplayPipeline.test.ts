/**
 * Run: npx tsx lib/mapDisplayPipeline.test.ts
 */
import {
  collectRenderedMarkerKeys,
  normalizeMapDisplayClusters,
} from "./mapRegionGesture";

const MAP_CLUSTER_LAT_DELTA = 0.1;

type Point = {
  id: string;
  latitude: number;
  longitude: number;
};

const buildDisplay = (points: Point[], latitudeDelta: number) => {
  if (latitudeDelta <= MAP_CLUSTER_LAT_DELTA) {
    return points.map((point) => ({
      type: "point" as const,
      point: { item: { id: point.id } },
    }));
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

  const display: Array<
    | { type: "point"; point: { item: { id: string } } }
    | {
        type: "cluster";
        id: string;
        points: Array<{ item: { id: string } }>;
      }
  > = [];

  buckets.forEach((group, key) => {
    if (group.length < 2) {
      display.push({
        type: "point",
        point: { item: { id: group[0].id } },
      });
      return;
    }
    display.push({
      type: "cluster",
      id: key,
      points: group.map((point) => ({ item: { id: point.id } })),
    });
  });

  return display;
};

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const keyFor = (item: { id?: unknown }) => String(item.id);

const fixtures: Point[] = [
  { id: "business-1", latitude: 32.715, longitude: -117.161 },
  { id: "business-2", latitude: 32.716, longitude: -117.162 },
  { id: "event-1", latitude: 32.717, longitude: -117.163 },
  { id: "event-2", latitude: 32.718, longitude: -117.164 },
];

const inputIds = new Set(fixtures.map((point) => point.id));

const zoomSequence = [0.05, 0.35, 0.08, 0.28, 0.06, 0.32, 0.05];
for (const delta of zoomSequence) {
  const raw = buildDisplay(fixtures, delta);
  const normalized = normalizeMapDisplayClusters(raw, keyFor);
  const rendered = collectRenderedMarkerKeys(normalized, keyFor);
  assert(
    `zoom delta ${delta} keeps all ids`,
    inputIds.size === rendered.size &&
      [...inputIds].every((id) => rendered.has(id))
  );
}

console.log("mapDisplayPipeline tests passed");
