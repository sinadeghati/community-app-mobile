import { router } from "expo-router";
import { logClaimNavigation } from "./claimNavigationDebug";
import {
  markPendingBusinessClaimAuthResumeReady,
  peekPendingBusinessClaimReturn,
  type PendingBusinessClaimReturn,
} from "./businessClaimReturnIntent";
import {
  resolvePostAuthNavigationAction,
  type ClaimProfileHref,
} from "./postAuthNavigationStrategy";

const runResetExploreThenProfile = (href: ClaimProfileHref): void => {
  router.replace("/(tabs)/explore");
  queueMicrotask(() => {
    router.push(href);
  });
};

/**
 * Email login omits options and reads the stored claim.
 * Social login passes the claim preloaded before the native sheet, including null.
 */
export const navigateAfterAuthentication = async (options?: {
  preloadedPending: PendingBusinessClaimReturn | null;
}): Promise<void> => {
  const pending =
    options !== undefined
      ? options.preloadedPending
      : await peekPendingBusinessClaimReturn();
  if (options === undefined && pending) {
    await markPendingBusinessClaimAuthResumeReady();
  }

  const action = resolvePostAuthNavigationAction(pending, {
    profileAlreadyInStack: pending ? true : undefined,
  });

  logClaimNavigation("post_auth", {
    pending: pending
      ? {
          routeProfileId: pending.routeProfileId,
          serverListingId: pending.serverListingId,
        }
      : null,
    action: action.type,
    canGoBack: router.canGoBack(),
    canDismiss: router.canDismiss(),
  });

  if (action.type === "dismiss_to_profile") {
    try {
      router.dismissTo(action.href);
    } catch (error) {
      logClaimNavigation("dismiss_to_failed", { error: String(error) });
      runResetExploreThenProfile(action.href);
    }
    return;
  }

  if (action.type === "reset_explore_then_profile") {
    runResetExploreThenProfile(action.href);
    return;
  }

  router.replace("/(tabs)/explore");
};
