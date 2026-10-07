/**
 * Server-authoritative listing id for claim/report actions.
 * Never submit actions using a stale local id or profile route id alone.
 */

export type ListingIdentityFields = {
  id?: string | number;
  server_listing_id?: string | number;
  listing_id?: string | number;
};

export type AuthoritativeListingResolution =
  | { ok: true; listingId: string; source: "api_confirmed" | "route" | "server_field" }
  | {
      ok: false;
      code: "missing" | "mismatch" | "invalid";
      message: string;
    };

const normalizeId = (value: unknown): string => {
  if (value == null) return "";
  const trimmed = String(value).trim();
  return trimmed;
};

export const isNumericListingId = (value: string): boolean =>
  /^\d+$/.test(value);

export const resolveAuthoritativeServerListingId = (input: {
  routeProfileId?: string;
  business?: ListingIdentityFields | null;
  apiConfirmedListingId?: string | null;
}): AuthoritativeListingResolution => {
  const routeId = normalizeId(input.routeProfileId);
  const apiId = normalizeId(input.apiConfirmedListingId);
  const business = input.business;

  const serverListingId = normalizeId(business?.server_listing_id);
  const listingIdField = normalizeId(business?.listing_id);
  const businessIdField = normalizeId(business?.id);

  if (apiId) {
    if (!isNumericListingId(apiId)) {
      return {
        ok: false,
        code: "invalid",
        message: "This business has an invalid server listing id.",
      };
    }
    if (routeId && isNumericListingId(routeId) && routeId !== apiId) {
      return {
        ok: false,
        code: "mismatch",
        message:
          "This profile does not match the server listing. Refresh the business and try again.",
      };
    }
    if (serverListingId && serverListingId !== apiId) {
      return {
        ok: false,
        code: "mismatch",
        message:
          "Saved business data is out of date for this listing. Refresh and try again.",
      };
    }
    return { ok: true, listingId: apiId, source: "api_confirmed" };
  }

  if (routeId && isNumericListingId(routeId)) {
    const conflicting = [serverListingId, listingIdField, businessIdField].filter(
      (candidate) => candidate && candidate !== routeId
    );
    if (conflicting.length > 0) {
      return {
        ok: false,
        code: "mismatch",
        message:
          "Local business data does not match this listing. Open the business again from Explore.",
      };
    }
    return { ok: true, listingId: routeId, source: "route" };
  }

  const serverCandidate = serverListingId || listingIdField;
  if (serverCandidate && isNumericListingId(serverCandidate)) {
    return { ok: true, listingId: serverCandidate, source: "server_field" };
  }

  return {
    ok: false,
    code: "missing",
    message:
      "This business is not linked to a server listing yet. Open it from Explore or refresh before claiming.",
  };
};

export const mergePublicListingFromApi = <T extends Record<string, unknown>>(
  apiListing: T,
  localListing?: Record<string, unknown> | null
): T & { server_listing_id: string | number; listing_id: string | number } => {
  const apiId = apiListing.id;
  const merged = {
    ...(localListing || {}),
    ...apiListing,
    id: apiId,
    server_listing_id: apiId,
    listing_id: apiId,
  };
  return merged as T & { server_listing_id: string | number; listing_id: string | number };
};
