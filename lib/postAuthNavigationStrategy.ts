import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";

export type PostAuthNavigationAction =
  | { type: "dismiss_to_existing_profile" }
  | {
      type: "replace_profile_fallback";
      routeProfileId: string;
      serverListingId: string;
    }
  | { type: "replace_explore" };

/**
 * After login/register/verify: pop auth screens instead of pushing a second profile.
 */
export const resolvePostAuthNavigationAction = (
  pending: PendingBusinessClaimReturn | null,
  canGoBack: boolean
): PostAuthNavigationAction => {
  if (pending) {
    if (canGoBack) {
      return { type: "dismiss_to_existing_profile" };
    }
    return {
      type: "replace_profile_fallback",
      routeProfileId: pending.routeProfileId,
      serverListingId: pending.serverListingId,
    };
  }
  return { type: "replace_explore" };
};
