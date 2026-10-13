/**
 * Node-testable subset of map clustering (mirrors lib/mapCoordinates buildMapDisplay).
 */

export const MAP_CLUSTER_LAT_DELTA = 0.1;

export type LiteResolvedMapPoint = {
  item: { id: number | string };
  index: number;
  latitude: number;
  longitude: number;
  hasExactCoordinate: boolean;
};

export type LiteMapMarkerDisplay =
  | { type: "point"; point: LiteResolvedMapPoint }
  | {
      type: "cluster";
      id: string;
      latitude: number;
      longitude: number;
      count: number;
      points: LiteResolvedMapPoint[];
    };

export const buildMapDisplayLite = (
  points: LiteResolvedMapPoint[],
  latitudeDelta: number
): LiteMapMarkerDisplay[] => {
  if (points.length === 0) return [];

  if (latitudeDelta <= MAP_CLUSTER_LAT_DELTA) {
    return points.map((point) => ({ type: "point", point }));
  }

  const cellSize = Math.max(latitudeDelta / 5, 0.018);
  const buckets = new Map<string, LiteResolvedMapPoint[]>();

  points.forEach((point) => {
    const latCell = Math.floor(point.latitude / cellSize);
    const lngCell = Math.floor(point.longitude / cellSize);
    const key = `${latCell}:${lngCell}`;
    const group = buckets.get(key) || [];
    group.push(point);
    buckets.set(key, group);
  });

  const display: LiteMapMarkerDisplay[] = [];

  buckets.forEach((group, key) => {
    if (group.length < 2) {
      display.push({ type: "point", point: group[0] });
      return;
    }

    const latitude =
      group.reduce((sum, point) => sum + point.latitude, 0) / group.length;
    const longitude =
      group.reduce((sum, point) => sum + point.longitude, 0) / group.length;

    display.push({
      type: "cluster",
      id: key,
      latitude,
      longitude,
      count: group.length,
      points: group,
    });
  });

  return display;
};
