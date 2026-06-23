import { Alert } from "react-native";
import { router } from "expo-router";
import { API } from "./api";
import {
  formatAuthError,
  isAuthEndpointUnavailable,
} from "./authErrors";
import { clearUserSession } from "./userSessionStorage";

type DeleteAccountOptions = {
  title?: string;
  message?: string;
  finalConfirmMessage?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  successTitle?: string;
  successMessage?: string;
  unavailableTitle?: string;
  unavailableMessage?: string;
  errorTitle?: string;
};

const defaultLabels: Required<DeleteAccountOptions> = {
  title: "Delete Account",
  message:
    "This permanently removes your Korook account, profile, and saved data on our servers. This cannot be undone.",
  finalConfirmMessage:
    "Are you absolutely sure? Your account and listings will be permanently deleted.",
  cancelLabel: "Cancel",
  confirmLabel: "Delete Account",
  successTitle: "Account deleted",
  successMessage: "Your account has been removed. We're sorry to see you go.",
  unavailableTitle: "Unavailable",
  unavailableMessage:
    "Account deletion is not available right now. Please try again later or email support@korook.com.",
  errorTitle: "Could not delete account",
};

/** Two-step delete confirmation wired to the backend when available. */
export function confirmDeleteAccount(options: DeleteAccountOptions = {}) {
  const labels = { ...defaultLabels, ...options };

  Alert.alert(labels.title, labels.message, [
    { text: labels.cancelLabel, style: "cancel" },
    {
      text: labels.confirmLabel,
      style: "destructive",
      onPress: () => {
        Alert.alert(
          labels.confirmLabel,
          labels.finalConfirmMessage,
          [
            { text: labels.cancelLabel, style: "cancel" },
            {
              text: labels.confirmLabel,
              style: "destructive",
              onPress: () => void performDeleteAccount(labels),
            },
          ]
        );
      },
    },
  ]);
}

async function performDeleteAccount(labels: Required<DeleteAccountOptions>) {
  try {
    await API.deleteAccount();
    await clearUserSession();
    Alert.alert(labels.successTitle, labels.successMessage, [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)"),
      },
    ]);
  } catch (error) {
    if (isAuthEndpointUnavailable(error)) {
      Alert.alert(labels.unavailableTitle, labels.unavailableMessage);
      return;
    }

    Alert.alert(
      labels.errorTitle,
      formatAuthError(
        error,
        "We could not delete your account. Please try again or contact support@korook.com."
      )
    );
  }
}

export function promptEmailVerification(email?: string) {
  if (email) {
    router.push({
      pathname: "/verify-email",
      params: { email },
    });
    return;
  }

  Alert.alert(
    "Verify your email",
    "Open the verification email we sent, or request a new code from the sign-up screen.",
    [{ text: "OK" }]
  );
}
