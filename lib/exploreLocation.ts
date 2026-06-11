import type { DiscoverableListing } from "./discoverableListings";
import { DEFAULT_CITY_LABEL } from "./mapCoordinates";
import type { AppLocationState } from "./appLocation";
import { listingMatchesActiveLocation } from "./activeLocationFilter";

/** Default display label when no saved location exists. */
export const DEFAULT_EXPLORE_LOCATION = DEFAULT_CITY_LABEL;

/** @deprecated Use listingMatchesActiveLocation with AppLocationState */
export const listingMatchesExploreLocation = (
  item: DiscoverableListing,
  _selectedLocation: string,
  locationState?: AppLocationState
): boolean => {
  if (locationState) {
    return listingMatchesActiveLocation(item, locationState);
  }
  return true;
};
