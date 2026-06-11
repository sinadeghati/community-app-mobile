import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  searchAddressSuggestions,
  type AddressSuggestion,
  type ParsedAddress,
} from "../../lib/addressAutocomplete";

type StreetAddressAutocompleteProps = {
  variant: "create" | "edit";
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelected: (address: ParsedAddress) => void;
  placeholder?: string;
  helperText?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
};

const CREATE_COLORS = {
  border: "#E5E7EB",
  card: "#fff",
  text: "#111",
  muted: "#6B7280",
  accent: "#11998E",
};

const EDIT_COLORS = {
  border: "#E2DED8",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  accent: "#11998E",
};

export function StreetAddressAutocomplete({
  variant,
  label,
  value,
  onChangeText,
  onAddressSelected,
  placeholder,
  helperText,
  autoCapitalize,
}: StreetAddressAutocompleteProps) {
  const colors = variant === "create" ? CREATE_COLORS : EDIT_COLORS;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipNextSearchRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setShowSuggestions(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const timer = setTimeout(() => {
      void searchAddressSuggestions(query)
        .then((results) => {
          if (requestId !== requestIdRef.current) return;
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setSuggestions([]);
          setShowSuggestions(false);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    skipNextSearchRef.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    onAddressSelected(suggestion.parsed);
  };

  return (
    <View style={{ marginBottom: variant === "create" ? 18 : 16 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "900",
          marginBottom: 8,
          color: colors.text,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          minHeight: 56,
          borderRadius: variant === "create" ? 17 : 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
        }}
      >
        <Ionicons
          name="pin-outline"
          size={22}
          color={colors.accent}
          style={{ marginRight: 12 }}
        />
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder || label}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#B8BBC2"
          style={{
            flex: 1,
            minHeight: 54,
            fontSize: 16,
            color: colors.text,
          }}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : null}
      </View>

      {helperText ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
            marginTop: 6,
            lineHeight: 18,
          }}
        >
          {helperText}
        </Text>
      ) : null}

      {showSuggestions && suggestions.length > 0 ? (
        <View
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: variant === "create" ? 14 : 12,
            backgroundColor: colors.card,
            overflow: "hidden",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion.id}
              onPress={() => handleSelect(suggestion)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  lineHeight: 20,
                }}
              >
                {suggestion.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
