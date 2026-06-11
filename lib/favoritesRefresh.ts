import { DeviceEventEmitter } from "react-native";

export const FAVORITES_CHANGED_EVENT = "favorites-changed";

export const notifyFavoritesChanged = () => {
  DeviceEventEmitter.emit(FAVORITES_CHANGED_EVENT);
};
