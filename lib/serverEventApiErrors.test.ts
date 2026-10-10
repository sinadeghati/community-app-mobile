/**
 * Run: npx tsx lib/serverEventApiErrors.test.ts
 */
import { formatServerEventApiError } from "./serverEventApiErrors";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const html = {
  response: {
    status: 500,
    data: "<!doctype html><title>Server Error (500)</title>",
  },
};

assert(
  "hides raw django html",
  !formatServerEventApiError(html).includes("<!doctype")
);

const json = {
  response: {
    status: 400,
    data: { title: ["Event title is required."] },
  },
};

assert(
  "shows json field errors",
  formatServerEventApiError(json).includes("Event title is required")
);

console.log("serverEventApiErrors tests passed");
