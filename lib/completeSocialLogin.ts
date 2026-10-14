import authStorage from "../app/utils/authStorage";
import { navigateAfterAuthentication } from "./postAuthNavigation";

export type SocialTokenPayload = {
  access?: string;
  refresh?: string;
  tokens?: { access?: string; refresh?: string };
};

export const completeSocialLogin = async (payload: SocialTokenPayload): Promise<void> => {
  const access = payload?.access || payload?.tokens?.access;
  const refresh = payload?.refresh || payload?.tokens?.refresh;

  if (!access) {
    throw new Error("missing_access_token");
  }

  await authStorage.setTokens({ access, refresh });

  const userId = authStorage.getUserIdStringFromAccessToken(access);
  if (userId) {
    const { prepareSessionForUser } = await import("./userSessionStorage");
    await prepareSessionForUser(userId, { social: true });
  }

  await navigateAfterAuthentication();
};
