/**
 * Run: npx tsx lib/appLaunchRouting.test.ts
 */
import {
  evaluateGuestColdStart,
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

const coldStartOnLogin = evaluateGuestColdStart("login", { kind: "none" }, false);
assert(
  "cold start on login settles and redirects to map",
  coldStartOnLogin.settled === true &&
    coldStartOnLogin.redirectHref === GUEST_MAP_ENTRY_HREF
);

const coldStartOnTabs = evaluateGuestColdStart("(tabs)", { kind: "none" }, false);
assert(
  "cold start on tabs settles without a redirect",
  coldStartOnTabs.settled === true && coldStartOnTabs.redirectHref === null
);

const inAppRegister = evaluateGuestColdStart("register", { kind: "none" }, true);
assert(
  "in-app register navigation is not treated as a cold start",
  inAppRegister.settled === true && inAppRegister.redirectHref === null
);

const inAppLogin = evaluateGuestColdStart("login", { kind: "none" }, true);
assert(
  "in-app login navigation is not treated as a cold start",
  inAppLogin.settled === true && inAppLogin.redirectHref === null
);

const waitingForSegment = evaluateGuestColdStart(undefined, { kind: "none" }, false);
assert(
  "missing root segment waits before settling",
  waitingForSegment.settled === false && waitingForSegment.redirectHref === null
);

console.log("appLaunchRouting tests passed");
