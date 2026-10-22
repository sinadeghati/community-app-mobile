export type SocialTokenPayload = {
  access?: string;
  refresh?: string;
  tokens?: { access?: string; refresh?: string };
};

type StoredTokens = { access: string; refresh?: string };

type AfterNativeAuthInteractions = (
  task: () => void | Promise<void>
) => void;

export type SocialLoginDependencies = {
  setTokens: (tokens: StoredTokens) => Promise<void>;
  clearHydrateCache: () => void | Promise<void>;
  navigateAfterAuthentication: () => Promise<void> | void;
  runAfterInteractions: AfterNativeAuthInteractions;
};

const runWithInteractionManager: AfterNativeAuthInteractions = (task) => {
  const { InteractionManager } = require("react-native") as {
    InteractionManager: {
      runAfterInteractions: (task: () => void) => void;
    };
  };
  InteractionManager.runAfterInteractions(() => {
    void task();
  });
};

/** Let the Google or Apple sheet finish dismissing before the next UI update. */
export const runAfterNativeAuthDismissal = (
  task: () => void | Promise<void>,
  runAfterInteractions: AfterNativeAuthInteractions = runWithInteractionManager
): Promise<void> =>
  new Promise((resolve, reject) => {
    runAfterInteractions(() => {
      Promise.resolve()
        .then(task)
        .then(() => resolve())
        .catch(reject);
    });
  });

export const socialLoginSetTokens = async (
  tokens: StoredTokens
): Promise<void> => {
  const { setSocialLoginTokens } = await import("../app/utils/authStorage");
  await setSocialLoginTokens(tokens);
};

const defaultSocialLoginDependencies = async (): Promise<SocialLoginDependencies> => {
  const { bindSocialLoginSession } = await import("./userSessionStorage");
  const { navigateAfterAuthentication } = await import("./postAuthNavigation");

  return {
    setTokens: socialLoginSetTokens,
    clearHydrateCache: bindSocialLoginSession,
    navigateAfterAuthentication,
    runAfterInteractions: runWithInteractionManager,
  };
};

export const completeSocialLogin = async (
  payload: SocialTokenPayload,
  dependencies?: SocialLoginDependencies
): Promise<void> => {
  const access = payload?.access || payload?.tokens?.access;
  const refresh = payload?.refresh || payload?.tokens?.refresh;

  if (!access) {
    throw new Error("missing_access_token");
  }

  const deps = dependencies ?? (await defaultSocialLoginDependencies());

  await deps.setTokens({ access, refresh });
  await deps.clearHydrateCache();

  await runAfterNativeAuthDismissal(
    () => deps.navigateAfterAuthentication(),
    deps.runAfterInteractions
  );
};
