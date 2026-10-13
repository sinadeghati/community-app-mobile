import type { DiscoverableListing } from "./discoverableListings";

/** Staging API snapshot — Tahchin Corner (listing id 22). */
export const STAGING_TAHCHIN_CORNER_LISTING: DiscoverableListing = {
  id: 22,
  business_name: "Tahchin Corner",
  title: "Tahchin Corner",
  category: "Food",
  city: "San Diego",
  state: "CA",
  latitude: 32.7846613,
  longitude: -117.0892957,
  coordinates_exact: true,
};

/** Staging Bandar Restaurant (listing id 25) — downtown Gaslamp. */
export const STAGING_BANDAR_LISTING: DiscoverableListing = {
  id: 25,
  business_name: "Bandar Restaurant",
  title: "Bandar Restaurant",
  category: "Food",
  city: "San Diego",
  state: "CA",
  address: "845 4th Ave, San Diego, CA 92101",
  latitude: 32.714093,
  longitude: -117.1609763,
  coordinates_exact: true,
};

/** Downtown placeholder coords often clustered with Bandar on the map. */
export const STAGING_DOWNTOWN_PLACEHOLDER_LISTING: DiscoverableListing = {
  id: 23,
  business_name: "QA Test Business 37a41ff6",
  title: "QA Admin Create 37a41ff6",
  category: "Food",
  city: "San Diego",
  state: "CA",
  latitude: 32.7157,
  longitude: -117.1611,
};
