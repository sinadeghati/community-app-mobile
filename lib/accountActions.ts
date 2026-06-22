import { Alert } from "react-native";
import { showComingSoon } from "../app/profile/comingSoon";

/** Shared delete-account confirmation (backend not wired yet). */
export function confirmDeleteAccount() {
  Alert.alert(
    "Delete Account",
    "This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Account",
        style: "destructive",
        onPress: () =>
          showComingSoon(
            "Delete Account",
            "Permanent account deletion will require confirmation and verification. This feature is not yet available in the MVP."
          ),
      },
    ]
  );
}

export function promptEmailVerification() {
  showComingSoon(
    "Email verification",
    "Email verification and resend will be available in a future release."
  );
}
