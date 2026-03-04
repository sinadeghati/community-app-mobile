import React from "react";
import { View, Text, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function HeroBanner() {
  return (
    <View
      style={{
        height: 170,
        width: "100%",
        borderRadius: 18,
        backgroundColor: "#E5F0FF",
        padding: 16,
        justifyContent: "flex-end",
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: "#111",
        }}
      >
        Discover Iranian Businesses
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "#555",
        }}
      >
        Buy, sell, and promote services in your city
      </Text>
    </View>
  );
}
