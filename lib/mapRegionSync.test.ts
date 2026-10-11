/**
 * Run: npx tsx lib/mapRegionSync.test.ts
 */
import { regionsAreSimilar } from "./mapRegionSync";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const base = {
  latitude: 32.7157,
  longitude: -117.1611,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

assert("identical regions are similar", regionsAreSimilar(base, { ...base }));
assert(
  "zoom change is not similar",
  !regionsAreSimilar(base, { ...base, latitudeDelta: 0.35 })
);
assert(
  "tiny float noise is similar",
  regionsAreSimilar(
    { ...base, latitudeDelta: 0.12000001 },
    { ...base, latitudeDelta: 0.12000002 }
  )
);

console.log("mapRegionSync tests passed");
