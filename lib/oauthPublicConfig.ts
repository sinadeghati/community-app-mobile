import { getApiEnvironment } from "./apiConfig";

export type OAuthPublicConfig = {
  googleIosClientId: string;
  googleWebClientId: string;
};

const read = (key: string): string => (process.env[key] || "").trim();

const stagingConfig = (): OAuthPublicConfig => ({
  googleIosClientId: read("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_STAGING"),
  googleWebClientId: read("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_STAGING"),
});

const productionConfig = (): OAuthPublicConfig => ({
  googleIosClientId: read("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_PRODUCTION"),
  googleWebClientId: read("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_PRODUCTION"),
});

/** Public OAuth client IDs only — never secrets. */
export const getOAuthPublicConfig = (): OAuthPublicConfig => {
  const env = getApiEnvironment();
  if (env === "production") return productionConfig();
  return stagingConfig();
};

export const isGoogleSignInConfigured = (): boolean => {
  const { googleIosClientId, googleWebClientId } = getOAuthPublicConfig();
  return Boolean(googleIosClientId || googleWebClientId);
};
