/**
 * Run: npx tsx lib/completeSocialLogin.test.ts
 */
import { createRequire } from "node:module";
import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";

const nodeRequire = createRequire(`${process.cwd()}/package.json`);

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const assertRejects = async (
  label: string,
  run: () => Promise<unknown>,
  expected: string
) => {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(expected)) {
      throw new Error(`FAIL: ${label} (message was ${message})`);
    }
    console.log(`ok: ${label}`);
    return;
  }
  throw new Error(`FAIL: ${label} (did not throw)`);
};

type StorageSpies = {
  secure: { key: string; value: string }[];
  mutations: string[];
  routes: string[];
};

const installStorageMocks = (): StorageSpies => {
  const state: StorageSpies = { secure: [], mutations: [], routes: [] };
  const Module = nodeRequire("module") as {
    prototype: { require: (this: unknown, id: string) => unknown };
  };
  const original = Module.prototype.require;

  Module.prototype.require = function (this: unknown, id: string) {
    const spec = String(id);
    if (spec.includes("expo-secure-store")) {
      return {
        setItemAsync: async (key: string, value: string) => {
          state.secure.push({ key, value });
        },
        getItemAsync: async () => null,
        deleteItemAsync: async () => undefined,
      };
    }
    if (spec.includes("async-storage")) {
      const record = (name: string) => async () => {
        state.mutations.push(name);
        return null;
      };
      const api = {
        setItem: record("setItem"),
        removeItem: record("removeItem"),
        multiRemove: record("multiRemove"),
        multiSet: record("multiSet"),
        getItem: record("getItem"),
        getAllKeys: async () => [],
        multiGet: record("multiGet"),
      };
      return { __esModule: true, default: api };
    }
    if (spec === "react-native") {
      return {
        DeviceEventEmitter: {
          emit() {},
          addListener() {
            return { remove() {} };
          },
        },
      };
    }
    if (spec === "expo-router") {
      return {
        router: {
          replace: (href: unknown) => {
            state.routes.push(`replace:${JSON.stringify(href)}`);
          },
          dismissTo: (href: unknown) => {
            state.routes.push(`dismissTo:${JSON.stringify(href)}`);
          },
          push: (href: unknown) => {
            state.routes.push(`push:${JSON.stringify(href)}`);
          },
          canGoBack: () => false,
          canDismiss: () => false,
        },
      };
    }
    return original.apply(this, arguments);
  };

  return state;
};

const claim: PendingBusinessClaimReturn = {
  routeProfileId: "19",
  serverListingId: "19",
  openClaimModal: true,
  savedAt: 1,
  awaitingAuth: true,
};

const main = async () => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  const storage = installStorageMocks();
  const { completeSocialLogin } = await import("./completeSocialLogin");

  await completeSocialLogin(
    { access: "access-token", refresh: "refresh-token" },
    null
  );
  const stored = storage.secure[0];
  const parsed = stored
    ? (JSON.parse(stored.value) as { access?: string; refresh?: string })
    : null;
  assert(
    "successful social login stores access and refresh and navigates once",
    storage.secure.length === 1 &&
      stored.key === "authTokens_v2" &&
      parsed?.access === "access-token" &&
      parsed?.refresh === "refresh-token" &&
      storage.routes.length === 1 &&
      storage.routes[0] === 'replace:"/(tabs)/explore"'
  );
  assert(
    "no AsyncStorage getItem, setItem, removeItem, multiGet, multiSet, or multiRemove occurs after social token storage",
    storage.mutations.length === 0
  );

  const routesBeforeClaim = storage.routes.length;
  const secureBeforeClaim = storage.secure.length;
  await completeSocialLogin(
    { tokens: { access: "nested-access", refresh: "nested-refresh" } },
    claim
  );
  const claimStored = storage.secure[secureBeforeClaim];
  const claimParsed = JSON.parse(claimStored.value) as {
    access?: string;
    refresh?: string;
  };
  assert(
    "a preloaded claim uses the existing profile route without another storage read/write",
    claimParsed.access === "nested-access" &&
      claimParsed.refresh === "nested-refresh" &&
      storage.mutations.length === 0 &&
      storage.routes.slice(routesBeforeClaim).join("|") ===
        'dismissTo:{"pathname":"/profile/v2","params":{"id":"19"}}'
  );

  const secureBeforeMissing = storage.secure.length;
  const routesBeforeMissing = storage.routes.length;
  await assertRejects(
    "a response without an access token does not navigate",
    () => completeSocialLogin({ refresh: "only-refresh" }, null),
    "missing_access_token"
  );
  assert(
    "missing access token neither stores nor navigates",
    storage.secure.length === secureBeforeMissing &&
      storage.routes.length === routesBeforeMissing &&
      storage.mutations.length === 0
  );

  console.log("completeSocialLogin tests passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
