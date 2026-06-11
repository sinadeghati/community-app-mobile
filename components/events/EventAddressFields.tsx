import React from "react";
import { Text, TextInput, View } from "react-native";
import type { ParsedAddress } from "../../lib/addressAutocomplete";
import { StreetAddressAutocomplete } from "../business/StreetAddressAutocomplete";

type EventAddressFieldsProps = {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  onStreetAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onAddressSelected: (parsed: ParsedAddress) => void;
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
  color: "#111",
};

export function EventAddressFields({
  streetAddress,
  city,
  state,
  zipCode,
  country,
  onStreetAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  onCountryChange,
  onAddressSelected,
}: EventAddressFieldsProps) {
  return (
    <View>
      <StreetAddressAutocomplete
        variant="create"
        label="Street Address"
        value={streetAddress}
        onChangeText={onStreetAddressChange}
        onAddressSelected={onAddressSelected}
        placeholder="Start typing your street address"
      />

      <Text style={labelStyle}>City *</Text>
      <TextInput
        value={city}
        onChangeText={onCityChange}
        placeholder="San Diego"
        placeholderTextColor="#999"
        style={inputStyle}
      />

      <Text style={labelStyle}>State *</Text>
      <TextInput
        value={state}
        onChangeText={(value) =>
          onStateChange(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))
        }
        placeholder="CA"
        placeholderTextColor="#999"
        autoCapitalize="characters"
        style={inputStyle}
      />

      <Text style={labelStyle}>ZIP / Postal Code *</Text>
      <TextInput
        value={zipCode}
        onChangeText={(value) =>
          onZipCodeChange(value.replace(/\D/g, "").slice(0, 5))
        }
        placeholder="92101"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        style={inputStyle}
      />

      <Text style={labelStyle}>Country</Text>
      <TextInput
        value={country}
        onChangeText={onCountryChange}
        placeholder="United States"
        placeholderTextColor="#999"
        style={inputStyle}
      />
    </View>
  );
}
