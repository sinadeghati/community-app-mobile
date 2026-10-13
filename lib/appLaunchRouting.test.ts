/**
 * Run: npx tsx lib/appLaunchRouting.test.ts
 */
import {
  GUEST_MAP_ENTRY_HREF,
  resolveGuestColdStartRedirect,
} from "./appLaunchRouting";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

assert(
  "logged-out cold start on login redirects to map",
  resolveGuestColdStartRedirect("login", { kind: "none" }) === GUEST_MAP_ENTRY_HREF
);
assert(
  "claim intent keeps login",
  resolveGuestColdStartRedirect("login", { kind: "claim" }) === null
);
assert(
  "deep link return keeps login",
  resolveGuestColdStartRedirect("login", {
    kind: "returnTo",
    path: "/event/12",
  }) === null
);
assert(
  "map tab does not redirect",
  resolveGuestColdStartRedirect("(tabs)", { kind: "none" }) === null
);

console.log("appLaunchRouting tests passed");
