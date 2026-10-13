import { getMapMarkerKey } from "./mapMarkerKeys";
import type { LiteMapMarkerDisplay, LiteResolvedMapPoint } from "./mapClusterDisplayLite";

export type ResolvedMapPoint = LiteResolvedMapPoint;
export type MapMarkerDisplay = LiteMapMarkerDisplay;

export const collectDisplayLeafMarkerKeys = (
  display: MapMarkerDisplay[],
  getKey: (item: { id: number | string }) => string = getMapMarkerKey
): Set<string> => {
  const keys = new Set<string>();
  display.forEach((entry) => {
    if (entry.type === "cluster") {
      entry.points.forEach((point) => keys.add(getKey(point.item)));
    } else {
      keys.add(getKey(entry.point.item));
    }
  });
  return keys;
};

export const collectInputPointMarkerKeys = (
  points: ResolvedMapPoint[],
  getKey: (item: { id: number | string }) => string = getMapMarkerKey
): string[] => points.map((point) => getKey(point.item));

/**
 * Every clustering input leaf must appear as a rendered cluster child or point.
 * Returns marker keys missing from the display output.
 */
export const findLostClusterLeafKeys = (
  inputPoints: ResolvedMapPoint[],
  display: MapMarkerDisplay[],
  getKey: (item: { id: number | string }) => string = getMapMarkerKey
): string[] => {
  const rendered = collectDisplayLeafMarkerKeys(display, getKey);
  const inputKeys = collectInputPointMarkerKeys(inputPoints, getKey);
  return inputKeys.filter((key) => !rendered.has(key));
};

export const assertClusterPipelineInvariant = (
  inputPoints: ResolvedMapPoint[],
  display: MapMarkerDisplay[]
): void => {
  const missing = findLostClusterLeafKeys(inputPoints, display);
  if (missing.length > 0) {
    throw new Error(
      `Map cluster invariant violated; missing leaf keys: ${missing.join(", ")}`
    );
  }
};
