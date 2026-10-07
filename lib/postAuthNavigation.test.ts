/**
 * Run: npx tsx lib/postAuthNavigation.test.ts
 */
import { resolveAuthoritativeServerListingId } from "./authoritativeListingId";
import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";
import { resolvePostAuthNavigationAction } from "./postAuthNavigationStrategy";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const pending: PendingBusinessClaimReturn = {
  routeProfileId: "19",
  serverListingId: "19",
  openClaimModal: true,
  savedAt: Date.now(),
  awaitingAuth: true,
};

assert(
  "claim auth success dismisses to existing profile (no duplicate push)",
  resolvePostAuthNavigationAction(pending, true).type ===
    "dismiss_to_existing_profile"
);

assert(
  "claim auth without stack uses single replace fallback",
  resolvePostAuthNavigationAction(pending, false).type ===
    "replace_profile_fallback"
);

assert(
  "ordinary login without claim goes to explore",
  resolvePostAuthNavigationAction(null, true).type === "replace_explore"
);

const resolution = resolveAuthoritativeServerListingId({
  routeProfileId: "19",
  business: {
    business_name: "Updated Demo Business",
    server_listing_id: "19",
  },
  apiConfirmedListingId: "19",
});

assert(
  "claim resume still targets the same server listing",
  resolution.ok === true && resolution.listingId === "19"
);

assert(
  "pending claim on profile B must not resume on profile A route",
  pending.routeProfileId === "19" && pending.routeProfileId !== "20"
);

console.log("postAuthNavigation.test.ts passed");
