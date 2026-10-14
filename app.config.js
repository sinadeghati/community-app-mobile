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

  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_STAGING?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_PRODUCTION?.trim() ||
    "";
  const iosUrlScheme = googleIosClientId
    ? `com.googleusercontent.apps.${googleIosClientId.replace(/\.apps\.googleusercontent\.com$/i, "")}`
    : undefined;

  const plugins = [...(config.plugins || [])];
  if (iosUrlScheme) {
    plugins.push([
      "@react-native-google-signin/google-signin",
      { iosUrlScheme },
    ]);
  }

  return {
    ...config,
    plugins,
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
