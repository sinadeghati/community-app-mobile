import { Alert } from "react-native";

export function showComingSoon(feature: string, description?: string) {
  Alert.alert(
    "Coming Soon",
    description ??
      `${feature} will be available in a future update. We're building this for the IranianApp community.`,
    [{ text: "Got it", style: "default" }]
  );
}
