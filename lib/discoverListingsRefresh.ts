import { DeviceEventEmitter } from "react-native";

export const DISCOVER_LISTINGS_REFRESH_EVENT = "discover-listings-refresh";
export const MY_EVENTS_REFRESH_EVENT = "my-events-refresh";

/** Notify Explore/Map to reload discoverable listings (e.g. after event/festival save). */
export const requestDiscoverListingsRefresh = () => {
  DeviceEventEmitter.emit(DISCOVER_LISTINGS_REFRESH_EVENT);
};

export const requestMyEventsRefresh = () => {
  DeviceEventEmitter.emit(MY_EVENTS_REFRESH_EVENT);
};
