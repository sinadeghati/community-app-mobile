import { Alert } from "react-native";
import { router } from "expo-router";
import { isUserLoggedIn } from "./businessReviews";

export async function ensureLoggedInForSave(
  actionLabel = "save favorites"
): Promise<boolean> {
  if (await isUserLoggedIn()) return true;

  Alert.alert("Login required", `Please log in to ${actionLabel}.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Log in", onPress: () => router.push("/(tabs)") },
  ]);

  return false;
}
