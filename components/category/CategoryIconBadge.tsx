import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import type { CategoryChipVisual } from "../../lib/categoryChipTheme";

type CategoryIconBadgeProps = {
  visual: CategoryChipVisual;
  size?: "compact" | "regular";
  active?: boolean;
};

export function CategoryIconBadge({
  visual,
  size = "regular",
  active = false,
}: CategoryIconBadgeProps) {
  const dimension = size === "compact" ? 20 : 42;
  const iconSize = size === "compact" ? 11 : 22;

  if (active) {
    return (
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor:
            size === "compact"
              ? "rgba(255,255,255,0.22)"
              : theme.colors.turquoise,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={visual.icon} size={iconSize} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: visual.tint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={visual.icon} size={iconSize} color={visual.color} />
    </View>
  );
}
