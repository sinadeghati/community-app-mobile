/** Stable React / native marker keys — no React Native or listing-loader imports. */

export type MapMarkerKeyItem = {
  id?: number | string;
  start_at?: string | null;
};

export const getMapMarkerKey = (item: MapMarkerKeyItem): string => {
  const id = item?.id;
  if (id === undefined || id === null || id === "") return "unknown";
  const isEvent =
    item.start_at !== undefined &&
    item.start_at !== null &&
    String(item.start_at).trim() !== "";
  return isEvent ? `event-${String(id)}` : `business-${String(id)}`;
};
