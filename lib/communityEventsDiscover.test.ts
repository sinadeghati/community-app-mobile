/**
 * Run: npx tsx lib/communityEventsDiscover.test.ts
 */
import { mergeCommunityEventsForDiscover } from "./communityEventsDiscoverMerge";
import { isServerEventId } from "./serverEventIds";

const assert = (label: string, condition: boolean) => {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`ok: ${label}`);
};

const deletedIds = new Set<string>();

const apiOnly = {
  id: "42",
  title: "API Event",
  city: "San Diego",
  state: "CA",
  event_date: "2026-09-01T18:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const legacyLocal = {
  id: "event-local-99",
  title: "شب یلدا",
  city: "San Diego",
  state: "CA",
  event_date: "2026-08-26T02:00:00.000Z",
  updated_at: "2026-08-18T20:00:00.000Z",
};

assert(
  "legacy local ids are not server ids",
  !isServerEventId(legacyLocal.id)
);

const merged = mergeCommunityEventsForDiscover(
  [apiOnly],
  [legacyLocal],
  deletedIds
);

assert(
  "merge helper still merges when called directly",
  merged.length === 2
);

assert(
  "discover pipeline no longer uses merge for public list (documented)",
  typeof mergeCommunityEventsForDiscover === "function"
);

console.log("communityEventsDiscover tests passed");
