import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  canUseAppleSignIn,
  canUseGoogleSignIn,
  signInWithAppleNative,
  signInWithGoogleNative,
  SocialAuthCancelledError,
} from "../../lib/socialAuth";
import { API } from "../../lib/api";
import { completeSocialLogin } from "../../lib/completeSocialLogin";
import { formatAuthError, isExistingAccountLinkRequired } from "../../lib/authErrors";
import { theme } from "../../lib/theme";

type Props = {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export function SocialSignInButtons({ disabled, onBusyChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canUseAppleSignIn()) return;
      try {
        const ok = await AppleAuthentication.isAvailableAsync();
        if (!cancelled) setAppleAvailable(ok);
      } catch {
        if (!cancelled) setAppleAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLoading = (value: boolean) => {
    setBusy(value);
    onBusyChange?.(value);
  };

  const handleGoogle = async () => {
    if (busy || disabled) return;
    try {
      setLoading(true);
      const { idToken } = await signInWithGoogleNative();
      const payload = await API.socialGoogleLogin(idToken);
      await completeSocialLogin(payload);
    } catch (error) {
      if (error instanceof SocialAuthCancelledError) return;
      if (isExistingAccountLinkRequired(error)) {
        const { Alert } = await import("react-native");
        Alert.alert(
          "Account already exists",
          "An account with this email already uses email and password. Sign in that way first, then link Google from your profile."
        );
        return;
      }
      const { Alert } = await import("react-native");
      Alert.alert(
        "Google sign-in failed",
        formatAuthError(error, "We could not sign you in with Google. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    if (busy || disabled) return;
    try {
      setLoading(true);
      const apple = await signInWithAppleNative();
      const payload = await API.socialAppleLogin(
        apple.identityToken,
        apple.nonce,
        apple.fullName
      );
      await completeSocialLogin(payload);
    } catch (error) {
      if (error instanceof SocialAuthCancelledError) return;
      if (isExistingAccountLinkRequired(error)) {
        const { Alert } = await import("react-native");
        Alert.alert(
          "Account already exists",
          "An account with this email already uses email and password. Sign in that way first, then link Apple from your profile."
        );
        return;
      }
      const { Alert } = await import("react-native");
      Alert.alert(
        "Apple sign-in failed",
        formatAuthError(error, "We could not sign you in with Apple. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const showGoogle = canUseGoogleSignIn();
  if (!showGoogle && !appleAvailable) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {showGoogle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: busy || disabled }}
          disabled={busy || disabled}
          onPress={handleGoogle}
          style={[styles.googleBtn, (busy || disabled) && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={styles.appleBtn}
          onPress={handleApple}
          disabled={busy || disabled}
        />
      ) : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or use email</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, gap: 12 },
  googleBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleText: { fontSize: 16, fontWeight: "700", color: "#111" },
  appleBtn: { width: "100%", height: 52 },
  disabled: { opacity: 0.6 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 13, color: theme.colors.muted, fontWeight: "600" },
});
