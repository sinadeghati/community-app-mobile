/**
 * Run: npx tsx lib/mapClusterInvariant.test.ts
 */
import { findLostClusterLeafKeys } from "./mapClusterInvariant";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const missing = findLostClusterLeafKeys(
  [
    {
      item: { id: 22 },
      index: 0,
      latitude: 0,
      longitude: 0,
      hasExactCoordinate: true,
    },
    {
      item: { id: 25 },
      index: 1,
      latitude: 0,
      longitude: 0,
      hasExactCoordinate: true,
    },
  ],
  [{ type: "point", point: { item: { id: 25 }, index: 1, latitude: 0, longitude: 0, hasExactCoordinate: true } }],
  (item) => `business-${String(item.id)}`
);

assert("detects tahchin-sized loss on split", missing.includes("business-22"));

console.log("mapClusterInvariant tests passed");
