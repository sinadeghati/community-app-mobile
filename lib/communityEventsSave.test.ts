/**
 * Run: npx tsx lib/communityEventsSave.test.ts
 */
import { pickLocalEventCoverUri } from "./serverEventMultipart";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const editWithoutNewFlyer = pickLocalEventCoverUri(
  undefined,
  "https://staging.example.com/media/events/covers/old.jpg?v=1"
);
assert("edit without new flyer does not upload remote url", editWithoutNewFlyer === undefined);

const editWithNewFlyer = pickLocalEventCoverUri(
  "file:///var/mobile/new-flyer.jpg",
  "https://staging.example.com/media/events/covers/old.jpg"
);
assert("edit with new flyer uploads local uri only", editWithNewFlyer?.startsWith("file:") === true);

console.log("communityEventsSave tests passed");
