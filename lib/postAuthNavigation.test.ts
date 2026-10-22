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

const runNavigationStorageTests = async () => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  const { createRequire } = await import("node:module");
  const nodeRequire = createRequire(`${process.cwd()}/package.json`);
  const storageCalls: string[] = [];
  const routeCalls: string[] = [];
  let storedClaim: string | null = null;
  const Module = nodeRequire("module") as {
    prototype: { require: (this: unknown, id: string) => unknown };
  };
  const original = Module.prototype.require;
  Module.prototype.require = function (this: unknown, id: string) {
    const spec = String(id);
    if (spec.includes("async-storage")) {
      const record = (name: string) => async (...args: unknown[]) => {
        storageCalls.push(name);
        if (name === "getItem") return storedClaim;
        if (name === "setItem") storedClaim = String(args[1] ?? "");
        return null;
      };
      const api = {
        getItem: record("getItem"),
        setItem: record("setItem"),
        removeItem: record("removeItem"),
        multiGet: record("multiGet"),
        multiSet: record("multiSet"),
        multiRemove: record("multiRemove"),
      };
      return { __esModule: true, default: api };
    }
    if (spec === "expo-router") {
      return {
        router: {
          replace: (href: unknown) => {
            routeCalls.push(`replace:${JSON.stringify(href)}`);
          },
          dismissTo: (href: unknown) => {
            routeCalls.push(`dismissTo:${JSON.stringify(href)}`);
          },
          push: (href: unknown) => {
            routeCalls.push(`push:${JSON.stringify(href)}`);
          },
          canGoBack: () => false,
          canDismiss: () => false,
        },
      };
    }
    return original.apply(this, arguments);
  };

  const { navigateAfterAuthentication } = await import("./postAuthNavigation");
  const claim = {
    routeProfileId: "19",
    serverListingId: "19",
    openClaimModal: true as const,
    savedAt: 1,
    awaitingAuth: true,
  };

  storageCalls.length = 0;
  routeCalls.length = 0;
  await navigateAfterAuthentication({ preloadedPending: claim });
  assert(
    "a preloaded claim uses the existing profile route without another storage read/write",
    storageCalls.length === 0 &&
      routeCalls.length === 1 &&
      routeCalls[0] ===
        'dismissTo:{"pathname":"/profile/v2","params":{"id":"19"}}'
  );

  storageCalls.length = 0;
  routeCalls.length = 0;
  await navigateAfterAuthentication({ preloadedPending: null });
  assert(
    "no claim replaces Explore exactly once",
    storageCalls.length === 0 &&
      routeCalls.length === 1 &&
      routeCalls[0] === 'replace:"/(tabs)/explore"'
  );

  storageCalls.length = 0;
  routeCalls.length = 0;
  storedClaim = JSON.stringify(claim);
  await navigateAfterAuthentication();
  assert(
    "email login still reads the stored claim and marks it ready",
    storageCalls.includes("getItem") &&
      storageCalls.includes("setItem") &&
      routeCalls.some((call) => call.startsWith("dismissTo:"))
  );

  console.log("postAuthNavigation.test.ts passed");
};

runNavigationStorageTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
