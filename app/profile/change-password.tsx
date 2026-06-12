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
import { API } from "../../lib/api";
import { formatAuthError, isPasswordEndpointUnavailable } from "../../lib/authErrors";
import {
  evaluatePasswordStrength,
  passwordsMatch,
} from "../../lib/authValidation";

const colors = {
  bg: "#F6F5F2",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  border: "#ECE7DF",
  teal: "#11998E",
  tealSoft: "#E7F6F4",
  success: "#16A34A",
  danger: "#DC2626",
};

const PasswordField = ({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) => (
  <View style={{ marginTop: 16 }}>
    <Text
      style={{
        fontSize: 14,
        fontWeight: "800",
        color: colors.text,
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        height: 56,
        borderRadius: 18,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
      }}
    >
      <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1,
          marginLeft: 12,
          fontSize: 16,
          color: colors.text,
          fontWeight: "600",
        }}
      />
      <Pressable onPress={onToggleVisible}>
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.muted}
        />
      </Pressable>
    </View>
  </View>
);

const Requirement = ({ ok, label }: { ok: boolean; label: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
    <Ionicons
      name={ok ? "checkmark-circle" : "ellipse-outline"}
      size={16}
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

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { checks, strengthLabel, isStrongEnough } = useMemo(
    () => evaluatePasswordStrength(newPassword),
    [newPassword]
  );

  const match = passwordsMatch(newPassword, confirmPassword);

  const canSubmit =
    currentPassword.length > 0 &&
    isStrongEnough &&
    match &&
    newPassword !== currentPassword &&
    !loading;

  const handleSubmit = async () => {
    if (!currentPassword) {
      Alert.alert("Missing information", "Enter your current password.");
      return;
    }

    if (!isStrongEnough) {
      Alert.alert("Weak password", "Your new password must meet all requirements.");
      return;
    }

    if (!match) {
      Alert.alert("Passwords do not match", "Confirm your new password.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Choose a different password",
        "Your new password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);
      await API.changePassword(currentPassword, newPassword);
      Alert.alert(
        "Password updated",
        "Your password has been changed. You are still signed in.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      if (isPasswordEndpointUnavailable(error)) {
        Alert.alert(
          "Unavailable",
          "Password change is not available on the server yet. Please try again later."
        );
        return;
      }

      Alert.alert(
        "Could not change password",
        formatAuthError(
          error,
          "Check your current password and try again."
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
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 40,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.teal} />
          </Pressable>

          <Text
            style={{
              fontSize: 34,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Change password
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 24,
              color: colors.muted,
              marginBottom: 20,
            }}
          >
            Enter your current password, then choose a strong new password.
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 26,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              visible={showCurrent}
              onToggleVisible={() => setShowCurrent(!showCurrent)}
            />

            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              visible={showNew}
              onToggleVisible={() => setShowNew(!showNew)}
            />

            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirm}
              onToggleVisible={() => setShowConfirm(!showConfirm)}
            />

            <View style={{ marginTop: 18 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: colors.text,
                }}
              >
                New password strength: {strengthLabel}
              </Text>

              <Requirement ok={checks.length} label="At least 8 characters" />
              <Requirement ok={checks.upper} label="One uppercase letter" />
              <Requirement ok={checks.lower} label="One lowercase letter" />
              <Requirement ok={checks.number} label="One number" />
              <Requirement ok={checks.special} label="One special character" />
              <Requirement ok={match} label="Passwords match" />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={{
                height: 56,
                borderRadius: 18,
                backgroundColor: canSubmit ? colors.teal : "#CBD5E1",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 22,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                  Update password
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
