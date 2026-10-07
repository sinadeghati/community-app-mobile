/**
 * Run: npx tsx lib/postAuthNavigation.test.ts
 */
import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";
import {
  resolvePostAuthNavigationAction,
  simulateLegacyReplaceProfileFallback,
  simulateStackAfterClaimAuth,
} from "./postAuthNavigationStrategy";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const pending: PendingBusinessClaimReturn = {
  routeProfileId: "19",
  serverListingId: "19",
  openClaimModal: true,
  savedAt: Date.now(),
  awaitingAuth: true,
};

const exploreToProfileLogin: Array<"tabs" | "profile" | "login"> = [
  "tabs",
  "profile",
  "login",
];

const dismissAction = resolvePostAuthNavigationAction(pending);
assert(
  "claim auth uses dismissTo profile (not replace)",
  dismissAction.type === "dismiss_to_profile"
);

const afterDismiss = simulateStackAfterClaimAuth(exploreToProfileLogin, dismissAction);
assert(
  "Explore → Profile → Login becomes Explore → Profile only",
  afterDismiss.join(">") === "tabs>profile"
);

const afterLegacyReplace = simulateLegacyReplaceProfileFallback(exploreToProfileLogin);
assert(
  "legacy replace fallback duplicated profile (5c00e55 failure mode)",
  afterLegacyReplace.join(">") === "tabs>profile>profile"
);

assert(
  "claim profile href matches Explore (id only, no extra params)",
  dismissAction.type === "dismiss_to_profile" &&
    dismissAction.href.params.id === "19" &&
    !("serverListingId" in dismissAction.href.params)
);

const afterSingleBack = [...afterDismiss];
afterSingleBack.pop();
assert(
  "one Back from single profile returns to Explore",
  afterSingleBack.join(">") === "tabs"
);

const registerStack: Array<"tabs" | "profile" | "verify"> = [
  "tabs",
  "profile",
  "verify",
];
const afterVerifyDismiss = simulateStackAfterClaimAuth(
  registerStack,
  dismissAction
);
assert(
  "Register verify-email dismisses to existing profile",
  afterVerifyDismiss.join(">") === "tabs>profile"
);

assert(
  "ordinary login without claim still replaces explore",
  resolvePostAuthNavigationAction(null).type === "replace_explore"
);

console.log("postAuthNavigation.test.ts passed");
