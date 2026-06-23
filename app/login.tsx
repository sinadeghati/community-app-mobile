import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import authStorage from "./utils/authStorage";
import { API } from "../lib/api";
import { formatAuthError, isEmailVerificationRequired } from "../lib/authErrors";
import { KorookLogo } from "../components/brand/KorookLogo";
import { theme } from "../lib/theme";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      Alert.alert("Missing information", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const payload = await API.login(cleanUsername, cleanPassword);
      const access = payload?.access || payload?.tokens?.access;
      const refresh = payload?.refresh || payload?.tokens?.refresh;

      if (!access) {
        Alert.alert("Login failed", "Invalid username or password.");
        return;
      }

      await authStorage.setTokens({ access, refresh });

      const userId = authStorage.getUserIdStringFromAccessToken(access);
      if (userId) {
        const { prepareSessionForUser } = await import("../lib/userSessionStorage");
        const identity = cleanUsername.includes("@")
          ? { email: cleanUsername }
          : { username: cleanUsername };
        await prepareSessionForUser(userId, identity);
      }

      router.replace("/(tabs)/explore");
    } catch (error) {
      if (isEmailVerificationRequired(error)) {
        Alert.alert(
          "Verify your email",
          "Your account is not active yet. Enter the verification code we sent to your email.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enter code",
              onPress: () =>
                router.push({
                  pathname: "/verify-email",
                  params: {
                    email: cleanUsername.includes("@") ? cleanUsername : "",
                    username: cleanUsername.includes("@") ? "" : cleanUsername,
                  },
                }),
            },
          ]
        );
        return;
      }

      Alert.alert(
        "Login failed",
        formatAuthError(error, "Please check your username and password and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <KorookLogo width={200} />
          </View>
          <Text style={styles.title}>Sign in to Korook</Text>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Username or email"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6B7280"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/register")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>Create account</Text>
          </Pressable>

          <Text style={styles.legalText}>
            By signing in you agree to our{" "}
            <Text
              onPress={() => router.push("/legal/terms-of-service")}
              style={styles.legalLink}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              onPress={() => router.push("/legal/privacy-policy")}
              style={styles.legalLink}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 28,
    color: theme.colors.navy,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E0D8",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
    minHeight: 56,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.navy,
    fontWeight: "600",
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  footerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  legalText: {
    marginTop: 18,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  legalLink: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
});
