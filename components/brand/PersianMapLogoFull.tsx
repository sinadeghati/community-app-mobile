import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { theme } from "../../lib/theme";
import { PersianMapLogoMark } from "./PersianMapLogoMark";

type PersianMapLogoFullProps = {
  iconSize?: number;
  mode?: "light" | "dark";
  style?: ViewStyle;
};

/**
 * Full PersianMap lockup — icon + wordmark (Option C).
 * Light: teal pin + charcoal text. Dark: white pin + ivory text.
 */
export function PersianMapLogoFull({
  iconSize = 40,
  mode = "light",
  style,
}: PersianMapLogoFullProps) {
  const isDark = mode === "dark";

  return (
    <View style={[styles.row, style]}>
      <PersianMapLogoMark
        size={iconSize}
        variant={isDark ? "dark" : "light"}
      />
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: iconSize * 0.58,
            color: isDark ? theme.colors.ivory : theme.colors.charcoal,
            marginLeft: iconSize * 0.28,
          },
        ]}
      >
        PersianMap
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordmark: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
});
