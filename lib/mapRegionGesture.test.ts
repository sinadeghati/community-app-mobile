/**
 * Run: npx tsx lib/mapRegionGesture.test.ts
 */
import {
  collectRenderedMarkerKeys,
  createRegionCompleteGuard,
  normalizeMapDisplayClusters,
} from "./mapRegionGesture";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const guard = createRegionCompleteGuard();
const first = guard.markCompleteStarted();
const second = guard.markCompleteStarted();
assert("stale complete is rejected", !guard.shouldApplyComplete(first));
assert("latest complete is accepted", guard.shouldApplyComplete(second));

const keyFor = (item: { id?: unknown }) => `business-${String(item.id)}`;

const normalized = normalizeMapDisplayClusters(
  [
    {
      type: "cluster",
      id: "1:2",
      points: [{ item: { id: 2 } }, { item: { id: 1 } }],
    },
  ],
  keyFor
);
assert(
  "cluster id is stable regardless of grid key",
  normalized[0].type === "cluster" && normalized[0].id === "business-1|business-2"
);

const keys = collectRenderedMarkerKeys(
  [
    {
      type: "cluster",
      points: [{ item: { id: 1 } }, { item: { id: 2 } }],
    },
    { type: "point", point: { item: { id: 3 } } },
  ],
  keyFor
);
assert("all input ids accounted for", keys.size === 3);

console.log("mapRegionGesture tests passed");
