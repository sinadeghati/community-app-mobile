import type { Region } from "react-native-maps";

/** Ignore stale debounced region-complete callbacks when a newer gesture finished later. */
export const createRegionCompleteGuard = () => {
  let latestCompleteSeq = 0;

  return {
    markCompleteStarted: () => {
      latestCompleteSeq += 1;
      return latestCompleteSeq;
    },
    shouldApplyComplete: (seq: number) => seq === latestCompleteSeq,
  };
};

export const normalizeMapDisplayClusters = <
  T extends
    | { type: "point"; point: { item: { id?: unknown } } }
    | {
        type: "cluster";
        id: string;
        points: Array<{ item: { id?: unknown } }>;
      },
>(
  entries: T[],
  getMarkerKey: (item: { id?: unknown }) => string
): T[] =>
  entries.map((entry) => {
    if (entry.type !== "cluster") return entry;
    const stableId = entry.points
      .map((point) => getMarkerKey(point.item))
      .sort()
      .join("|");
    return { ...entry, id: stableId };
  });

export const collectRenderedMarkerKeys = (
  entries: Array<
    | { type: "point"; point: { item: { id?: unknown } } }
    | {
        type: "cluster";
        points: Array<{ item: { id?: unknown } }>;
      }
  >,
  getMarkerKey: (item: { id?: unknown }) => string
): Set<string> => {
  const keys = new Set<string>();
  entries.forEach((entry) => {
    if (entry.type === "cluster") {
      entry.points.forEach((point) => keys.add(getMarkerKey(point.item)));
    } else {
      keys.add(getMarkerKey(entry.point.item));
    }
  });
  return keys;
};

export const clusterTierForRegion = (region: Pick<Region, "latitudeDelta">) =>
  region.latitudeDelta <= 0.1
    ? "expanded"
    : `z${Math.round(region.latitudeDelta * 1000)}`;
