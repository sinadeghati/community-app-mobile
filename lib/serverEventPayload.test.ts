/**
 * Run: npx tsx lib/serverEventPayload.test.ts
 */
import { buildServerEventPayload } from "./serverEventPayload";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const withoutEnd = buildServerEventPayload({
  title: "QA",
  city: "San Diego",
  state: "CA",
  eventDateIso: "2026-10-17T19:00:00.000Z",
});

assert("omits ends_at when end date empty", !("ends_at" in withoutEnd));
assert("omits endDateIso when end date empty", !("endDateIso" in withoutEnd));

const withEnd = buildServerEventPayload({
  title: "QA",
  city: "San Diego",
  state: "CA",
  eventDateIso: "2026-10-17T19:00:00.000Z",
  endDateIso: "2026-10-17T22:00:00.000Z",
});

assert("includes ends_at when provided", withEnd.ends_at === "2026-10-17T22:00:00.000Z");

console.log("serverEventPayload tests passed");
