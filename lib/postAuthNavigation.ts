import { router } from "expo-router";
import { logClaimNavigation } from "./claimNavigationDebug";
import {
  markPendingBusinessClaimAuthResumeReady,
  peekPendingBusinessClaimReturn,
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

/** After login/register/verify, return to pending business claim or default home. */
export const navigateAfterAuthentication = async (): Promise<void> => {
  const pending = await peekPendingBusinessClaimReturn();
  if (pending) {
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
