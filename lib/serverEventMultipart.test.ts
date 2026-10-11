/**
 * Run: npx tsx lib/serverEventMultipart.test.ts
 */
import {
  buildEventCoverFilePart,
  isLocalEventMediaUri,
  pickLocalEventCoverUri,
} from "./serverEventMultipart";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

assert("file uri is local", isLocalEventMediaUri("file:///var/mobile/flyer.jpg"));
assert("https is not local", !isLocalEventMediaUri("https://cdn.example.com/a.jpg"));
assert(
  "picks local over remote",
  pickLocalEventCoverUri(
    "https://cdn.example.com/old.jpg",
    "file:///tmp/new.jpg"
  ) === "file:///tmp/new.jpg"
);
assert(
  "ignores remote only",
  pickLocalEventCoverUri("https://cdn.example.com/old.jpg") === undefined
);

const part = buildEventCoverFilePart("file:///var/mobile/IMG_0001.HEIC");
assert("heic mime", part.type === "image/heic");
assert("filename preserved", part.name === "IMG_0001.HEIC");

console.log("serverEventMultipart tests passed");
