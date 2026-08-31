import React, { useRef } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "../../lib/i18n";

type EventTicketUrlFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onFocused?: (fieldNode: View | null) => void;
};

const labelStyle = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: "#222",
  marginBottom: 10,
  marginTop: 14,
};

const inputStyle = {
  backgroundColor: "#F8F8F8",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#E5E5E5",
};

export function EventTicketUrlField({
  value,
  onChangeText,
  onFocused,
}: EventTicketUrlFieldProps) {
  const { t, isRTL } = useTranslation();
  const fieldRef = useRef<View>(null);

  return (
    <View ref={fieldRef}>
      <Text style={[labelStyle, { textAlign: isRTL ? "right" : "left" }]}>
        {t("event.ticketUrl")}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocused?.(fieldRef.current)}
        placeholder="https://eventbrite.com/... or lu.ma/..."
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={inputStyle}
      />
      <Text
        style={{
          marginTop: 8,
          fontSize: 12,
          lineHeight: 18,
          color: "#777",
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {t("event.ticketUrlHint")}
      </Text>
    </View>
  );
}
