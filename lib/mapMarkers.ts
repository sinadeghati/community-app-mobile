import type { DiscoverableListing } from "./discoverableListings";
import { getListingId, isEventListing } from "./discoverableListings";
import { getMapMarkerKey as getMapMarkerKeyLite } from "./mapMarkerKeys";
import { MAP_CLUSTER_LAT_DELTA } from "./mapClusterDisplayLite";

export const getMapMarkerKey = (item: DiscoverableListing): string =>
  getMapMarkerKeyLite({
    id: getListingId(item),
    start_at: isEventListing(item) ? item.start_at ?? "" : undefined,
  });

export const getClusterMarkerKey = (
  clusterId: string,
  count: number,
  latitudeDelta: number
): string => {
  const tier =
    latitudeDelta <= MAP_CLUSTER_LAT_DELTA
      ? "expanded"
      : `z${Math.round(latitudeDelta * 1000)}`;
  return `cluster-${tier}-${clusterId}-${count}`;
};
