import { router } from "expo-router";
import { peekPendingBusinessClaimReturn } from "./businessClaimReturnIntent";

/** After login/register/verify, return to pending business claim or default home. */
export const navigateAfterAuthentication = async (): Promise<void> => {
  const pending = await peekPendingBusinessClaimReturn();
  if (pending) {
    router.replace({
      pathname: "/profile/v2",
      params: {
        id: pending.routeProfileId,
        serverListingId: pending.serverListingId,
        openClaim: "1",
      },
    });
    return;
  }

  router.replace("/(tabs)/explore");
};
