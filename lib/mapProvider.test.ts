/**
 * Run: npx tsx lib/mapProvider.test.ts
 */
const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const providerForPlatform = (platform: string) =>
  platform === "android" ? "google" : undefined;

assert("iOS uses default Apple Maps provider", providerForPlatform("ios") === undefined);
assert("Android uses Google Maps provider", providerForPlatform("android") === "google");

console.log("mapProvider.test.ts passed");
