import type { DiscoverableListing } from "./discoverableListings";
import { getListingId, isEventListing } from "./discoverableListings";
import { MAP_CLUSTER_LAT_DELTA } from "./mapCoordinates";

export const getMapMarkerKey = (item: DiscoverableListing): string => {
  const id = getListingId(item);
  if (!id) return "unknown";
  return isEventListing(item) ? `event-${id}` : `business-${id}`;
};

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
