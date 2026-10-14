/**
 * Run: npx tsx lib/oauthPublicConfig.test.ts
 */
import { getOAuthPublicConfig } from "./oauthPublicConfig";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

process.env.EXPO_PUBLIC_API_ENV = "staging";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_STAGING = "ios-staging.apps.googleusercontent.com";
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_STAGING = "web-staging.apps.googleusercontent.com";

const staging = getOAuthPublicConfig();
assert("staging uses staging google ids", staging.googleIosClientId.includes("ios-staging"));
assert("staging web client id", staging.googleWebClientId.includes("web-staging"));

console.log("oauthPublicConfig tests passed");
