/**
 * Run: npx tsx lib/serverEvents.test.ts
 */
import { isServerEventId } from "./serverEventIds";
import { mapApiEventToCommunityEvent, buildServerEventPayload } from "./serverEvents";
const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

assert("numeric server ids", isServerEventId("42"));
assert("legacy local ids rejected", !isServerEventId("event-123456"));

const mapped = mapApiEventToCommunityEvent({
  id: 7,
  title: "API Event",
  owner_id: 3,
  status: "published",
  starts_at: "2026-09-01T18:00:00.000Z",
  city: "San Diego",
  state: "CA",
  category: "Community Gathering",
});

assert("maps owner_id", mapped.owner_id === "3");
assert("maps published flag", mapped.is_published === true);
assert("string id", mapped.id === "7");

const payload = buildServerEventPayload(
  {
    title: "Test",
    city: "Irvine",
    state: "CA",
    eventDateIso: "2026-10-01T19:00:00.000Z",
  },
  { organizer: "Host" }
);

assert("payload title", payload.title === "Test");
assert("payload starts_at", payload.starts_at === "2026-10-01T19:00:00.000Z");
assert("payload organizer", payload.organizer === "Host");

console.log("serverEvents tests passed");
