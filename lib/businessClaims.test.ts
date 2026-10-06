/**
 * Run: npx tsx lib/businessClaims.test.ts
 */
import {
  classifyClaimSubmitError,
  resolveBusinessClaimListingId,
} from "./businessClaimsRules";

const assert = (label: string, condition: boolean) => {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`ok: ${label}`);
};

assert(
  "uses server listing id for claims",
  resolveBusinessClaimListingId({ server_listing_id: 99, id: "local" }, "local") ===
    "99"
);

assert(
  "duplicate pending maps to duplicate kind",
  classifyClaimSubmitError({
    response: {
      status: 400,
      data: { detail: "You already have a pending claim for this business." },
    },
  }).kind === "duplicate"
);

assert(
  "already owned maps to already_claimed",
  classifyClaimSubmitError({
    response: {
      status: 400,
      data: { detail: "This business already has an owner." },
    },
  }).kind === "already_claimed"
);

console.log("businessClaims.test.ts passed");
