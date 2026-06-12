import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { API } from "../lib/api";
import { formatAuthError } from "../lib/authErrors";
import {
  evaluatePasswordStrength,
  passwordsMatch,
} from "../lib/authValidation";
import authStorage from "./utils/authStorage";

const colors = {
  bg: "#F7F5F0",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  border: "#E5E0D8",
  teal: "#0D9488",
  tealDark: "#0F766E",
  tealSoft: "rgba(13,148,136,0.10)",
  gold: "#E6C27A",
  danger: "#DC2626",
  success: "#16A34A",
  black: "#111111",
};

const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  rightIcon,
  onRightPress,
  keyboardType = "default",
  autoCapitalize = "none",
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) => (
  <View style={{ marginTop: 18 }}>
    <Text
      style={{
        fontSize: 14,
        fontWeight: "900",
        color: colors.text,
        marginBottom: 8,
      }}
    >
      {label}
    </Text>

    <View
      style={{
        height: 58,
        borderRadius: 18,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.muted} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          flex: 1,
          marginLeft: 12,
          fontSize: 16,
          color: colors.text,
          fontWeight: "600",
        }}
      />

      {rightIcon ? (
        <Pressable onPress={onRightPress}>
          <Ionicons name={rightIcon} size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  </View>
);

const Requirement = ({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    }}
  >
    <Ionicons
      name={ok ? "checkmark-circle" : "ellipse-outline"}
      size={18}
      color={ok ? colors.success : colors.muted}
    />

    <Text
      style={{
        marginLeft: 8,
        color: ok ? colors.text : colors.muted,
        fontSize: 13,
        fontWeight: "700",
      }}
    >
      {label}
    </Text>
  </View>
);

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  const checks = useMemo(
    () => ({
      ...strength.checks,
      match: passwordsMatch(password, confirmPassword),
    }),
    [strength.checks, password, confirmPassword]
  );

  const { strengthCount, strengthLabel } = strength;

  const canSubmit =
    username.trim().length >= 3 &&
    email.includes("@") &&
    checks.length &&
    checks.upper &&
    checks.lower &&
    checks.number &&
    checks.special &&
    checks.match &&
    !loading;

  const handleRegister = async () => {
    if (!canSubmit) {
      Alert.alert("Check your information", "Please complete all requirements.");
      return;
    }

    try {
      setLoading(true);

      const cleanUsername = username.trim();
      const cleanEmail = email.trim();

      await API.register(cleanUsername, cleanEmail, password);

      const loginResult = await API.login(cleanUsername, password);

      const access = loginResult?.access || loginResult?.tokens?.access;
      const refresh = loginResult?.refresh || loginResult?.tokens?.refresh;

      if (!access) {
        Alert.alert("Account created", "Please sign in with your new account.");
        router.back();
        return;
      }

      await authStorage.setTokens({
        access,
        refresh,
      });

      const userId = authStorage.getUserIdStringFromAccessToken(access);
      if (userId) {
        const { prepareSessionForUser, saveUserProfile } = await import(
          "../lib/userSessionStorage"
        );
        await saveUserProfile(userId, {
          id: userId,
          user_id: userId,
          username: cleanUsername,
          email: cleanEmail,
        });
        await prepareSessionForUser(userId, {
          username: cleanUsername,
          email: cleanEmail,
        });
      }

      router.replace("/(tabs)/profile");
      return;
    } catch (error) {
      Alert.alert(
        "Could not create account",
        formatAuthError(error, "Please check your details and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          <View
            style={{
              backgroundColor: colors.teal,
              paddingHorizontal: 22,
              paddingTop: 22,
              paddingBottom: 72,
              borderBottomLeftRadius: 36,
              borderBottomRightRadius: 36,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>

            <Text
              style={{
                marginTop: 24,
                fontSize: 36,
                fontWeight: "900",
                color: "#fff",
              }}
            >
              Create account
            </Text>

            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                lineHeight: 24,
                color: "rgba(255,255,255,0.86)",
                fontWeight: "600",
              }}
            >
              Join the community and discover local businesses, events, and trusted services.
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 18,
              marginTop: -46,
              backgroundColor: colors.card,
              borderRadius: 32,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.tealSoft,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.teal} />
              <Text
                style={{
                  marginLeft: 6,
                  color: colors.teal,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Secure sign up
              </Text>
            </View>

            <Field
              label="Username"
              icon="person-outline"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
            />

            <Field
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightPress={() => setShowPassword(!showPassword)}
            />

            <Field
              label="Confirm password"
              icon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              onRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <View style={{ marginTop: 18 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "900",
                    color: colors.text,
                  }}
                >
                  Password strength
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color:
                      strengthLabel === "Strong"
                        ? colors.success
                        : strengthLabel === "Good"
                          ? colors.teal
                          : colors.danger,
                  }}
                >
                  {strengthLabel}
                </Text>
              </View>

              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: "#E5E7EB",
                  marginTop: 9,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${(strengthCount / 5) * 100}%`,
                    height: "100%",
                    backgroundColor:
                      strengthLabel === "Strong"
                        ? colors.success
                        : strengthLabel === "Good"
                          ? colors.teal
                          : colors.danger,
                  }}
                />
              </View>

              <Requirement ok={checks.length} label="At least 8 characters" />
              <Requirement ok={checks.upper} label="One uppercase letter" />
              <Requirement ok={checks.lower} label="One lowercase letter" />
              <Requirement ok={checks.number} label="One number" />
              <Requirement ok={checks.special} label="One special character" />
              <Requirement ok={checks.match} label="Passwords match" />
            </View>

            <View
              style={{
                marginTop: 20,
                borderRadius: 20,
                backgroundColor: colors.tealSoft,
                padding: 14,
                flexDirection: "row",
              }}
            >
              <Ionicons name="lock-closed" size={20} color={colors.teal} />

              <Text
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: colors.muted,
                  lineHeight: 21,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                We use secure authentication. Your password should be unique and not reused from other apps.
              </Text>
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={!canSubmit}
              style={{
                height: 58,
                borderRadius: 20,
                backgroundColor: canSubmit ? colors.teal : "#CBD5E1",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 22,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <Text
              style={{
                marginTop: 18,
                textAlign: "center",
                color: colors.muted,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              By creating an account, you agree to our Terms and Privacy Policy.
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={{
                marginTop: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.teal, fontWeight: "900" }}>
                Already have an account? Sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}