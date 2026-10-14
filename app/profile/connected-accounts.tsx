import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import { API } from "../../lib/api";
import { formatAuthError } from "../../lib/authErrors";
import {
  signInWithAppleNative,
  signInWithGoogleNative,
  SocialAuthCancelledError,
  canUseAppleSignIn,
  canUseGoogleSignIn,
} from "../../lib/socialAuth";
import { theme } from "../../lib/theme";

export default function ConnectedAccountsScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState<{ has_password: boolean; providers: string[] }>({
    has_password: false,
    providers: [],
  });

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.fetchAuthMethods();
      setMethods(data);
    } catch (error) {
      Alert.alert("Could not load sign-in methods", formatAuthError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const linkGoogle = async () => {
    if (busy) return;
    try {
      setBusy(true);
      const { idToken } = await signInWithGoogleNative();
      await API.linkGoogleAccount(idToken);
      await refresh();
    } catch (error) {
      if (error instanceof SocialAuthCancelledError) return;
      Alert.alert("Link failed", formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const linkApple = async () => {
    if (busy) return;
    try {
      setBusy(true);
      const apple = await signInWithAppleNative();
      await API.linkAppleAccount(apple.identityToken, apple.nonce);
      await refresh();
    } catch (error) {
      if (error instanceof SocialAuthCancelledError) return;
      Alert.alert("Link failed", formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (provider: "google" | "apple") => {
    Alert.alert(
      `Disconnect ${provider === "google" ? "Google" : "Apple"}?`,
      "You will need another way to sign in if you remove this provider.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await API.disconnectAuthProvider(provider);
              await refresh();
            } catch (error) {
              Alert.alert("Disconnect failed", formatAuthError(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const hasGoogle = methods.providers.includes("google");
  const hasApple = methods.providers.includes("apple");

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: "Connected accounts" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            <Text style={styles.hint}>
              Link Google or Apple to sign in faster. We never merge accounts by email alone —
              use this screen after signing in with your password.
            </Text>

            <View style={styles.row}>
              <Text style={styles.label}>Google</Text>
              {hasGoogle ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Disconnect Google"
                  onPress={() => disconnect("google")}
                  disabled={busy}
                >
                  <Text style={styles.linkDanger}>Disconnect</Text>
                </Pressable>
              ) : canUseGoogleSignIn() ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Link Google account"
                  onPress={linkGoogle}
                  disabled={busy}
                >
                  <Text style={styles.link}>Link</Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>Not available</Text>
              )}
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Apple</Text>
              {hasApple ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Disconnect Apple"
                  onPress={() => disconnect("apple")}
                  disabled={busy}
                >
                  <Text style={styles.linkDanger}>Disconnect</Text>
                </Pressable>
              ) : canUseAppleSignIn() ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Link Apple account"
                  onPress={linkApple}
                  disabled={busy}
                >
                  <Text style={styles.link}>Link</Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>iOS only</Text>
              )}
            </View>

            <Text style={styles.footer}>
              Password sign-in: {methods.has_password ? "enabled" : "not set"}
            </Text>
          </>
        )}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.ivory },
  content: { padding: 20, gap: 16 },
  hint: { color: theme.colors.muted, lineHeight: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: { fontSize: 16, fontWeight: "700", color: theme.colors.navy },
  link: { color: theme.colors.primary, fontWeight: "800" },
  linkDanger: { color: "#DC2626", fontWeight: "800" },
  muted: { color: theme.colors.muted },
  footer: { marginTop: 8, color: theme.colors.muted, fontSize: 13 },
  back: { marginTop: 24 },
});
