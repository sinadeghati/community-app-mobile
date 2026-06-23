import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { API } from "../lib/api";
import {
  formatVerificationError,
  isAuthEndpointUnavailable,
} from "../lib/authErrors";
import { completeAuthSessionAndGoToProfile } from "../lib/completeAuthSession";
import {
  clearPendingRegistration,
  getPendingRegistration,
} from "../lib/pendingRegistration";
import { KorookLogo } from "../components/brand/KorookLogo";
import { korookBrand } from "../lib/korookBrand";
import { theme } from "../lib/theme";

const CODE_LENGTH = 6;

const colors = {
  bg: theme.colors.ivory,
  card: theme.colors.card,
  text: theme.colors.navy,
  muted: theme.colors.muted,
  border: theme.colors.border,
  teal: theme.colors.primary,
  tealSoft: "rgba(0,194,184,0.10)",
  danger: "#DC2626",
};

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; username?: string }>();
  const pending = getPendingRegistration();

  const email = (params.email || pending?.email || "").trim().toLowerCase();
  const username = (params.username || pending?.username || "").trim();

  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => "")
  );
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const canVerify = code.length === CODE_LENGTH && !verifying && Boolean(email);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const next = [...digits];

    if (!cleaned) {
      next[index] = "";
      setDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH).split("");
      pasted.forEach((char, offset) => {
        if (index + offset < CODE_LENGTH) {
          next[index + offset] = char;
        }
      });
      setDigits(next);
      const focusIndex = Math.min(index + pasted.length, CODE_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    next[index] = cleaned;
    setDigits(next);
    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!email) {
      Alert.alert(
        "Missing email",
        "We could not find your email address. Please register again."
      );
      router.replace("/register");
      return;
    }

    if (code.length !== CODE_LENGTH) {
      Alert.alert("Enter your code", `Please enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }

    try {
      setVerifying(true);
      const result = await API.verifyEmail(email, code);
      const access = result?.access || result?.tokens?.access;
      const refresh = result?.refresh || result?.tokens?.refresh;
      const password = pending?.password;

      clearPendingRegistration();

      await completeAuthSessionAndGoToProfile({
        username: username || email,
        email,
        access,
        refresh,
        password,
      });
    } catch (error) {
      if (isAuthEndpointUnavailable(error)) {
        Alert.alert(
          "Verification unavailable",
          "Email verification is not enabled on the server yet. Please try again later or contact support@korook.com."
        );
        return;
      }

      Alert.alert("Could not verify", formatVerificationError(error));
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending || resendCooldown > 0) {
      return;
    }

    try {
      setResending(true);
      await API.resendEmailVerification(email);
      startResendCooldown();
      Alert.alert(
        "Code sent",
        `If an account exists for ${email}, a new verification code has been sent.`
      );
    } catch (error) {
      if (isAuthEndpointUnavailable(error)) {
        Alert.alert(
          "Unavailable",
          "We could not resend a code right now. Please try again later."
        );
        return;
      }

      Alert.alert(
        "Could not resend",
        formatVerificationError(
          error,
          "We could not send a new code. Please wait a moment and try again."
        )
      );
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    clearPendingRegistration();
    router.replace("/register");
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
              onPress={handleCancel}
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

            <KorookLogo width={180} />
            <Text
              style={{
                marginTop: 20,
                fontSize: 30,
                fontWeight: "900",
                color: "#fff",
              }}
            >
              Verify your email
            </Text>

            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                lineHeight: 24,
                color: "rgba(255,255,255,0.9)",
                fontWeight: "600",
              }}
            >
              Enter the {CODE_LENGTH}-digit code we sent to activate your Korook account.
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
              <Ionicons name="mail-open-outline" size={16} color={colors.teal} />
              <Text
                style={{
                  marginLeft: 6,
                  color: colors.teal,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Check your inbox
              </Text>
            </View>

            <Text
              style={{
                marginTop: 18,
                fontSize: 14,
                fontWeight: "800",
                color: colors.text,
              }}
            >
              Sent to
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: "700",
                color: colors.muted,
              }}
            >
              {email || "your email address"}
            </Text>

            <View
              style={{
                marginTop: 22,
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputsRef.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleDigitChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  selectTextOnFocus
                  style={{
                    flex: 1,
                    height: 58,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: digit ? colors.teal : colors.border,
                    backgroundColor: "#F8FAFC",
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "800",
                    color: colors.text,
                  }}
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={!canVerify}
              style={{
                height: 58,
                borderRadius: 20,
                backgroundColor: canVerify ? colors.teal : "#CBD5E1",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 22,
              }}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                  Activate account
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleResend}
              disabled={resending || resendCooldown > 0}
              style={{ marginTop: 18, alignItems: "center" }}
            >
              {resending ? (
                <ActivityIndicator color={colors.teal} />
              ) : (
                <Text
                  style={{
                    color: resendCooldown > 0 ? colors.muted : colors.teal,
                    fontWeight: "800",
                    fontSize: 14,
                  }}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend verification code"}
                </Text>
              )}
            </Pressable>

            <View
              style={{
                marginTop: 20,
                borderRadius: 20,
                backgroundColor: colors.tealSoft,
                padding: 14,
                flexDirection: "row",
              }}
            >
              <Ionicons name="information-circle" size={20} color={colors.teal} />
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
                Your account stays inactive until you verify. {korookBrand.tagline}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
