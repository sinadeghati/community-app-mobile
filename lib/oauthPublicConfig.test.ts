/**
 * Run: npx tsx lib/oauthPublicConfig.test.ts
 */
import { getOAuthPublicConfig, isGoogleSignInConfigured } from "./oauthPublicConfig";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

process.env.EXPO_PUBLIC_API_ENV = "staging";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_STAGING =
  "  ios-staging.apps.googleusercontent.com  ";
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_STAGING =
  "web-staging.apps.googleusercontent.com";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_PRODUCTION =
  "ios-production.apps.googleusercontent.com";
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_PRODUCTION =
  "web-production.apps.googleusercontent.com";

const staging = getOAuthPublicConfig();
assert(
  "staging resolves the iOS Google client ID",
  staging.googleIosClientId === "ios-staging.apps.googleusercontent.com"
);
assert(
  "staging resolves the Web Google client ID",
  staging.googleWebClientId === "web-staging.apps.googleusercontent.com"
);
assert(
  "staging Google sign-in is configured",
  isGoogleSignInConfigured() === true
);

process.env.EXPO_PUBLIC_API_ENV = "production";
const production = getOAuthPublicConfig();
assert(
  "production resolves the iOS Google client ID",
  production.googleIosClientId === "ios-production.apps.googleusercontent.com"
);
assert(
  "production resolves the Web Google client ID",
  production.googleWebClientId === "web-production.apps.googleusercontent.com"
);
assert(
  "production Google sign-in is configured",
  isGoogleSignInConfigured() === true
);

console.log("oauthPublicConfig tests passed");
