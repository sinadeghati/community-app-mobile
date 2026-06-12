/**
 * Run: npx tsx lib/myBusinessOwnership.test.ts
 * Guards My Businesses ownership when backend user ids are reused.
 */
import {
  isMyBusinessForUser,
  filterBusinessesForUser,
} from "./myBusinessOwnership";

const assert = (label: string, condition: boolean) => {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`ok: ${label}`);
};

const parisaBusiness = {
  id: "biz-1",
  name: "Parisa Shop",
  owner_id: "2",
  owner_username: "parisa",
  owner_email: "parisa@example.com",
};

const davidIdentity = { username: "david", email: "david@example.com" };

assert(
  "david does not inherit parisa business on reused user id",
  !isMyBusinessForUser(parisaBusiness, "2", davidIdentity)
);

assert(
  "parisa still owns her business",
  isMyBusinessForUser(parisaBusiness, "2", {
    username: "parisa",
    email: "parisa@example.com",
  })
);

const filtered = filterBusinessesForUser(
  [parisaBusiness, { id: "biz-2", owner_id: "2", owner_username: "david" }],
  "2",
  "david",
  "david@example.com"
);
assert("filter keeps only david-owned rows", filtered.length === 1);
assert(
  "filter keeps david business name",
  String(filtered[0].owner_username) === "david"
);

console.log("All myBusinessOwnership tests passed.");
