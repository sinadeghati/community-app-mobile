const resolveGoogleMapsApiKeyAndroid = () =>
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID?.trim() ||
  process.env.GOOGLE_MAPS_API_KEY_ANDROID?.trim() ||
  "";

/** @param {{ config: import('@expo/config').ExpoConfig }} param0 */
module.exports = ({ config }) => {
  const googleMapsApiKeyAndroid = resolveGoogleMapsApiKeyAndroid();

  if (process.env.EAS_BUILD === "true" && !googleMapsApiKeyAndroid) {
    throw new Error(
      "Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID for Android MapView. " +
        "Create an EAS secret with the Google Maps SDK for Android API key " +
        "(restricted to com.korook.app and the EAS release keystore SHA-1)."
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKeyAndroid,
        },
      },
    },
  };
};
