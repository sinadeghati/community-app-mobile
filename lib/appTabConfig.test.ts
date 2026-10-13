/**
 * Run: npx tsx lib/appTabConfig.test.ts
 */
import { APP_INITIAL_TAB_ROUTE } from "./appTabConfig";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

assert("cold launch opens map tab", APP_INITIAL_TAB_ROUTE === "map");

console.log("appTabConfig tests passed");
