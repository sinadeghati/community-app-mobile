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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BUSINESS_REPORT_REASON_OPTIONS,
  BUSINESS_REPORT_SUCCESS_MESSAGE,
  type BusinessReportReason,
  submitBusinessReport,
} from "../../lib/businessReports";
import { theme } from "../../lib/theme";

type BusinessReportModalProps = {
  visible: boolean;
  targetId: string;
  businessTitle: string;
  onClose: () => void;
};

export function BusinessReportModal({
  visible,
  targetId,
  businessTitle,
  onClose,
}: BusinessReportModalProps) {
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Dimensions.get("window").height * 0.88;
  const [step, setStep] = useState<"reason" | "details">("reason");
  const [selectedReason, setSelectedReason] = useState<BusinessReportReason | null>(
    null
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStep("reason");
      setSelectedReason(null);
      setDetails("");
      setSubmitting(false);
      setKeyboardInset(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") {
      return;
    }

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

  const handleSelectReason = (reason: BusinessReportReason) => {
    setSelectedReason(reason);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!selectedReason || !targetId || submitting) return;

    setSubmitting(true);
    const result = await submitBusinessReport({
      target_type: "business",
      target_id: targetId,
      reason: selectedReason,
      details,
    });
    setSubmitting(false);

    if (result.ok) {
      onClose();
      Alert.alert("Report submitted", BUSINESS_REPORT_SUCCESS_MESSAGE);
      return;
    }

    if (result.kind === "unauthenticated") {
      Alert.alert("Login required", result.message, [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => router.push("/(tabs)") },
      ]);
      return;
    }

    Alert.alert("Could not submit report", result.message);
  };

  const selectedReasonLabel =
    BUSINESS_REPORT_REASON_OPTIONS.find((option) => option.value === selectedReason)
      ?.label || "";

  const sheetBottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss report"
        />

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
              marginBottom:
                Platform.OS === "android" ? keyboardInset : 0,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              {step === "details" ? (
                <Pressable
                  onPress={() => setStep("reason")}
                  disabled={submitting}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color={theme.colors.charcoal}
                  />
                </Pressable>
              ) : null}

              <Text
                style={{
                  flex: 1,
                  fontSize: 18,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                {step === "reason" ? "Report business" : "Add details"}
              </Text>

              <Pressable
                onPress={handleClose}
                disabled={submitting}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                color: theme.colors.muted,
                marginBottom: 14,
              }}
            >
              {step === "reason"
                ? `Why are you reporting ${businessTitle}?`
                : `Reason: ${selectedReasonLabel}. Add any helpful context (optional).`}
            </Text>

            {step === "reason" ? (
              <>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0 }}
                >
                  {BUSINESS_REPORT_REASON_OPTIONS.map((option, index) => (
                    <React.Fragment key={option.value}>
                      {index > 0 ? (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: theme.colors.border,
                            marginLeft: 12,
                          }}
                        />
                      ) : null}

                      <Pressable
                        onPress={() => handleSelectReason(option.value)}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: theme.colors.charcoal,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={handleClose}
                  disabled={submitting}
                  style={{
                    marginTop: 10,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: theme.colors.softCard,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  editable={!submitting}
                  placeholder="Tell us more (optional)"
                  placeholderTextColor={theme.colors.muted}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 120,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    lineHeight: 22,
                    color: theme.colors.charcoal,
                    backgroundColor: theme.colors.softCard,
                  }}
                />

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
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "900",
                        color: "#fff",
                      }}
                    >
                      Submit report
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleClose}
                  disabled={submitting}
                  style={{
                    marginTop: 10,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: theme.colors.softCard,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
