/**
 * Run: npx tsx lib/authoritativeListingId.test.ts
 */
import {
  mergePublicListingFromApi,
  resolveAuthoritativeServerListingId,
} from "./authoritativeListingId";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const businessA = {
  id: "19",
  server_listing_id: 19,
  business_name: "Updated Demo Business",
  title: "Car 1",
};

const businessB = {
  id: "20",
  server_listing_id: 20,
  business_name: "Other Shop",
};

const apiConfirmedA = resolveAuthoritativeServerListingId({
  routeProfileId: "19",
  business: businessA,
  apiConfirmedListingId: "19",
});
assert(
  "api-confirmed id wins for business A",
  apiConfirmedA.ok === true && apiConfirmedA.listingId === "19"
);

assert(
  "business A claim cannot target business B listing id",
  resolveAuthoritativeServerListingId({
    routeProfileId: "19",
    business: businessA,
    apiConfirmedListingId: "20",
  }).ok === false
);

assert(
  "stale server_listing_id mismatch blocks claim",
  resolveAuthoritativeServerListingId({
    routeProfileId: "19",
    business: { ...businessA, server_listing_id: 20 },
    apiConfirmedListingId: "19",
  }).ok === false
);

const routeOnly = resolveAuthoritativeServerListingId({
  routeProfileId: "19",
  business: { business_name: "Updated Demo Business" },
});
assert(
  "route numeric id without conflicting local fields is allowed",
  routeOnly.ok === true && routeOnly.listingId === "19"
);

const merged = mergePublicListingFromApi(
  { id: 19, title: "Car 1", business_name: "Updated Demo Business" },
  { id: "local-uuid", server_listing_id: 99, business_name: "Wrong Cache" }
);
assert(
  "api merge overwrites stale server_listing_id",
  String(merged.server_listing_id) === "19" &&
    merged.business_name === "Updated Demo Business"
);

const businessBResolved = resolveAuthoritativeServerListingId({
  routeProfileId: "20",
  business: businessB,
  apiConfirmedListingId: "20",
});
assert(
  "business B profile cannot claim as business A when route is B",
  businessBResolved.ok === true &&
    businessBResolved.listingId === "20" &&
    resolveAuthoritativeServerListingId({
      routeProfileId: "20",
      business: businessB,
      apiConfirmedListingId: "19",
    }).ok === false
);

console.log("authoritativeListingId.test.ts passed");
