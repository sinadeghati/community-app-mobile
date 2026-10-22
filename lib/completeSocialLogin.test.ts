/**
 * Run: npx tsx lib/completeSocialLogin.test.ts
 */
import { createRequire } from "node:module";

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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

type StorageSpies = {
  secure: { key: string; value: string }[];
  mutations: string[];
};

const installStorageMocks = (): StorageSpies => {
  const state: StorageSpies = { secure: [], mutations: [] };
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
      };
      return {
        default: {
          setItem: record("setItem"),
          removeItem: record("removeItem"),
          multiRemove: record("multiRemove"),
          multiSet: record("multiSet"),
          getItem: async () => null,
          getAllKeys: async () => [],
          multiGet: async () => [],
        },
      };
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
    return original.apply(this, arguments);
  };

  return state;
};

const main = async () => {
  const storage = installStorageMocks();
  const { completeSocialLogin, socialLoginSetTokens } = await import(
    "./completeSocialLogin"
  );
  const { bindSocialLoginSession } = await import("./userSessionStorage");

  bindSocialLoginSession();
  assert(
    "clearing the social hydrate cache does not write AsyncStorage",
    storage.mutations.length === 0
  );

  type Harness = {
    events: string[];
    releaseInteraction: () => void;
  };

  const createHarness = (): Harness => {
    const events: string[] = [];
    let queued: (() => void | Promise<void>) | null = null;

    return {
      events,
      releaseInteraction: () => {
        if (!queued) throw new Error("navigation was not scheduled");
        void queued();
      },
      deps: {
        setTokens: async (tokens: { access: string; refresh?: string }) => {
          await socialLoginSetTokens(tokens);
          events.push("tokens");
        },
        clearHydrateCache: () => {
          bindSocialLoginSession();
          events.push("cache");
        },
        navigateAfterAuthentication: async () => {
          events.push("navigate");
        },
        runAfterInteractions: (task: () => void | Promise<void>) => {
          queued = task;
          events.push("scheduled");
        },
      },
    } as Harness & {
      deps: {
        setTokens: (tokens: { access: string; refresh?: string }) => Promise<void>;
        clearHydrateCache: () => void;
        navigateAfterAuthentication: () => Promise<void>;
        runAfterInteractions: (task: () => void | Promise<void>) => void;
      };
    };
  };

  const success = createHarness() as ReturnType<typeof createHarness> & {
    deps: {
      setTokens: (tokens: { access: string; refresh?: string }) => Promise<void>;
      clearHydrateCache: () => void;
      navigateAfterAuthentication: () => Promise<void>;
      runAfterInteractions: (task: () => void | Promise<void>) => void;
    };
  };
  const pending = completeSocialLogin(
    { access: "access-token", refresh: "refresh-token" },
    success.deps
  );

  const waitUntil = async (ready: () => boolean) => {
    for (let attempt = 0; attempt < 20 && !ready(); attempt += 1) {
      await flush();
    }
  };

  await waitUntil(() => success.events.includes("scheduled"));

  const stored = storage.secure[0];
  const parsed = stored ? (JSON.parse(stored.value) as { access?: string; refresh?: string }) : null;
  assert(
    "successful social login stores access and refresh through SecureStore",
    storage.secure.length === 1 &&
      stored.key === "authTokens_v2" &&
      parsed?.access === "access-token" &&
      parsed?.refresh === "refresh-token"
  );
  assert(
    "successful social login does not call AsyncStorage removeItem, multiRemove, or setItem before navigation",
    storage.mutations.length === 0 && !success.events.includes("navigate")
  );
  assert(
    "navigation is scheduled only after SecureStore persistence",
    success.events.indexOf("tokens") !== -1 &&
      success.events.indexOf("tokens") < success.events.indexOf("scheduled")
  );

  success.releaseInteraction();
  await pending;

  assert(
    "navigation runs only after token persistence",
    success.events.includes("navigate") &&
      success.events.indexOf("tokens") < success.events.indexOf("navigate") &&
      storage.mutations.length === 0
  );

  const nestedStart = storage.secure.length;
  const nested = createHarness() as typeof success;
  const nestedPending = completeSocialLogin(
    { tokens: { access: "nested-access", refresh: "nested-refresh" } },
    nested.deps
  );
  await waitUntil(() => nested.events.includes("scheduled"));
  const nestedStored = storage.secure[nestedStart];
  const nestedParsed = JSON.parse(nestedStored.value) as {
    access?: string;
    refresh?: string;
  };
  assert(
    "nested token payloads are stored in SecureStore before navigation",
    nestedParsed.access === "nested-access" &&
      nestedParsed.refresh === "nested-refresh" &&
      !nested.events.includes("navigate") &&
      storage.mutations.length === 0
  );
  nested.releaseInteraction();
  await nestedPending;

  const missing = createHarness() as typeof success;
  const secureBeforeMissing = storage.secure.length;
  await assertRejects(
    "a response without an access token does not navigate",
    () => completeSocialLogin({ refresh: "only-refresh" }, missing.deps),
    "missing_access_token"
  );
  assert(
    "a missing access token does not store tokens or schedule navigation",
    missing.events.length === 0 && storage.secure.length === secureBeforeMissing
  );

  console.log("completeSocialLogin tests passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
