import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BUSINESS_CLAIM_REVIEW_NOTICE,
  submitBusinessClaim,
} from "../../lib/businessClaims";
import { theme } from "../../lib/theme";

type BusinessClaimModalProps = {
  visible: boolean;
  listingId: string;
  businessTitle: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function BusinessClaimModal({
  visible,
  listingId,
  businessTitle,
  onClose,
  onSubmitted,
}: BusinessClaimModalProps) {
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Dimensions.get("window").height * 0.9;
  const [claimantName, setClaimantName] = useState("");
  const [relationshipRole, setRelationshipRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setClaimantName("");
      setRelationshipRole("");
      setContactEmail("");
      setContactPhone("");
      setVerificationMessage("");
      setSubmitting(false);
      setKeyboardInset(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardInset(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const validate = (): string | null => {
    if (!claimantName.trim()) return "Enter your name.";
    if (!relationshipRole.trim()) return "Describe your role with this business.";
    if (!contactEmail.trim()) return "Enter a contact email.";
    if (!contactPhone.trim()) return "Enter a contact phone number.";
    if (verificationMessage.trim().length < 10) {
      return "Add a short verification message (at least 10 characters).";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!listingId || submitting) return;
    const validationError = validate();
    if (validationError) {
      Alert.alert("Missing information", validationError);
      return;
    }

    setSubmitting(true);
    const result = await submitBusinessClaim({
      listingId,
      claimant_name: claimantName,
      relationship_role: relationshipRole,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      verification_message: verificationMessage,
    });
    setSubmitting(false);

    if (result.ok) {
      onClose();
      onSubmitted?.();
      Alert.alert("Claim submitted", result.message);
      return;
    }

    if (result.kind === "duplicate") {
      onClose();
      onSubmitted?.();
      Alert.alert("Claim pending", result.message);
      return;
    }

    Alert.alert("Could not submit claim", result.message);
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: sheetBottomPadding,
              maxHeight: maxSheetHeight,
              marginBottom: Platform.OS === "android" ? keyboardInset : 0,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: theme.colors.charcoal,
                marginBottom: 4,
              }}
            >
              Claim this business
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.muted, marginBottom: 12 }}>
              {businessTitle}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.muted,
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              {BUSINESS_CLAIM_REVIEW_NOTICE}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
              <Field label="Your name" value={claimantName} onChangeText={setClaimantName} />
              <Field
                label="Your role"
                value={relationshipRole}
                onChangeText={setRelationshipRole}
                placeholder="Owner, manager, etc."
              />
              <Field
                label="Contact email"
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Contact phone"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
              <Field
                label="Verification message"
                value={verificationMessage}
                onChangeText={setVerificationMessage}
                multiline
                placeholder="Briefly explain how you can verify ownership."
              />
            </ScrollView>

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={{
                marginTop: 16,
                height: 50,
                borderRadius: 14,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                  Submit claim request
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: theme.colors.charcoal,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 12,
          minHeight: multiline ? 96 : undefined,
          fontSize: 15,
          color: theme.colors.charcoal,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
