import React, { useState } from "react";
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
import { formatAuthError, isPasswordEndpointUnavailable } from "../lib/authErrors";
import { isValidEmail } from "../lib/authValidation";

const colors = {
  bg: "#F7F5F0",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  border: "#E5E0D8",
  teal: "#0D9488",
  tealSoft: "rgba(13,148,136,0.10)",
};

const RESET_SUCCESS_MESSAGE =
  "If an account exists, password reset instructions have been sent.";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = isValidEmail(email) && !loading && !submitted;

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Check your email", "Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await API.requestPasswordReset(email);
      setSubmitted(true);
      Alert.alert("Check your email", RESET_SUCCESS_MESSAGE);
    } catch (error) {
      if (isPasswordEndpointUnavailable(error)) {
        Alert.alert(
          "Unavailable",
          "Password reset is not available right now. Please try again later or contact support."
        );
        return;
      }

      Alert.alert(
        "Could not send reset email",
        formatAuthError(
          error,
          "We could not send reset instructions. Please try again."
        )
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
                fontSize: 34,
                fontWeight: "900",
                color: "#fff",
              }}
            >
              Forgot password
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
              Enter your email and we will send reset instructions if an account
              exists.
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
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "900",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Email
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
              <Ionicons name="mail-outline" size={22} color={colors.muted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitted}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: colors.text,
                  fontWeight: "600",
                }}
              />
            </View>

            {submitted ? (
              <View
                style={{
                  marginTop: 18,
                  borderRadius: 18,
                  backgroundColor: colors.tealSoft,
                  padding: 14,
                  flexDirection: "row",
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.teal}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    color: colors.muted,
                    lineHeight: 21,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {RESET_SUCCESS_MESSAGE}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
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
                  {submitted ? "Email sent" : "Send reset instructions"}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              <Text style={{ color: colors.teal, fontWeight: "900" }}>
                Back to sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
