import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";

export type SocialTokenPayload = {
  access?: string;
  refresh?: string;
  tokens?: { access?: string; refresh?: string };
};

type StoredTokens = { access: string; refresh?: string };

export type SocialLoginDependencies = {
  setTokens: (tokens: StoredTokens) => Promise<void>;
  clearHydrateCache: () => void | Promise<void>;
  navigateAfterAuthentication: (
    preloadedPending: PendingBusinessClaimReturn | null
  ) => Promise<void> | void;
};

export const socialLoginSetTokens = async (
  tokens: StoredTokens
): Promise<void> => {
  const { setSocialLoginTokens } = await import("../app/utils/authStorage");
  await setSocialLoginTokens(tokens);
};

const defaultSocialLoginDependencies = async (
  preloadedPending: PendingBusinessClaimReturn | null
): Promise<SocialLoginDependencies> => {
  const { bindSocialLoginSession } = await import("./userSessionStorage");
  const { navigateAfterAuthentication } = await import("./postAuthNavigation");

  return {
    setTokens: socialLoginSetTokens,
    clearHydrateCache: bindSocialLoginSession,
    navigateAfterAuthentication: () =>
      navigateAfterAuthentication({ preloadedPending }),
  };
};

export const completeSocialLogin = async (
  payload: SocialTokenPayload,
  preloadedPending: PendingBusinessClaimReturn | null = null,
  dependencies?: SocialLoginDependencies
): Promise<void> => {
  const access = payload?.access || payload?.tokens?.access;
  const refresh = payload?.refresh || payload?.tokens?.refresh;

  if (!access) {
    throw new Error("missing_access_token");
  }

  const deps =
    dependencies ?? (await defaultSocialLoginDependencies(preloadedPending));

  await deps.setTokens({ access, refresh });
  await deps.clearHydrateCache();
  await deps.navigateAfterAuthentication(preloadedPending);
};
