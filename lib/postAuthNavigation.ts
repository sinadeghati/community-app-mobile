import { router } from "expo-router";
import {
  markPendingBusinessClaimAuthResumeReady,
  peekPendingBusinessClaimReturn,
} from "./businessClaimReturnIntent";
import { resolvePostAuthNavigationAction } from "./postAuthNavigationStrategy";

/** After login/register/verify, return to pending business claim or default home. */
export const navigateAfterAuthentication = async (): Promise<void> => {
  const pending = await peekPendingBusinessClaimReturn();
  if (pending) {
    await markPendingBusinessClaimAuthResumeReady();
  }

  const action = resolvePostAuthNavigationAction(
    pending,
    router.canGoBack()
  );

  if (action.type === "dismiss_to_existing_profile") {
    router.back();
    return;
  }

  if (action.type === "replace_profile_fallback") {
    router.replace({
      pathname: "/profile/v2",
      params: {
        id: action.routeProfileId,
        serverListingId: action.serverListingId,
      },
    });
    return;
  }

  router.replace("/(tabs)/explore");
};
