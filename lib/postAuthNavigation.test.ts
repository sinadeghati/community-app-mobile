/**
 * Run: npx tsx lib/postAuthNavigation.test.ts
 */
import { resolveAuthoritativeServerListingId } from "./authoritativeListingId";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

/** Claim return routing depends on a stable server listing id for the opened profile. */
const profileRouteId = "19";
const serverListingId = "19";

const resolution = resolveAuthoritativeServerListingId({
  routeProfileId: profileRouteId,
  business: {
    business_name: "Updated Demo Business",
    server_listing_id: serverListingId,
  },
  apiConfirmedListingId: serverListingId,
});

assert(
  "login/register return uses same server listing as opened profile",
  resolution.ok && resolution.listingId === serverListingId
);

assert(
  "openClaim cannot proceed when server listing id missing",
  resolveAuthoritativeServerListingId({
    routeProfileId: "local-profile-1",
    business: { business_name: "Cached Only" },
  }).ok === false
);

console.log("postAuthNavigation.test.ts passed");
