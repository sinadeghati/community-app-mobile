/**
 * Run: npx tsx lib/mapDiscoverableMerge.test.ts
 */
const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const mergeDiscoverableListingsById = <T extends { id?: number | string }>(
  previous: T[],
  incoming: T[]
): T[] => {
  const byId = new Map<string, T>();
  previous.forEach((item) => {
    const id = String(item.id ?? "");
    if (id) byId.set(id, item);
  });
  incoming.forEach((item) => {
    const id = String(item.id ?? "");
    if (!id) return;
    const existing = byId.get(id);
    byId.set(id, existing ? { ...existing, ...item } : item);
  });
  return Array.from(byId.values());
};

const merged = mergeDiscoverableListingsById(
  [{ id: 1, title: "A", city: "Poway" }],
  [{ id: 2, title: "B" }, { id: 1, title: "A updated", state: "CA" }]
);

assert("merge keeps all ids", merged.length === 2);
assert(
  "merge preserves ids and overlays fields",
  merged.find((row) => String(row.id) === "1")?.state === "CA"
);

console.log("mapDiscoverableMerge tests passed");
