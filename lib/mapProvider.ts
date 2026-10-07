import { Platform } from "react-native";
import { PROVIDER_GOOGLE } from "react-native-maps";

/** Apple Maps on iOS; Google Maps on Android when native SDK is configured. */
export const getNativeMapProvider = (): typeof PROVIDER_GOOGLE | undefined =>
  Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;
