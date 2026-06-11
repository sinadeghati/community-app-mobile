import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { theme } from "../../lib/theme";

type PersianMapHeroLogoProps = {
  size?: number;
  style?: ViewStyle;
};

/** Temporary MVP mark — white circle + teal P (Home header only). */
export function PersianMapHeroLogo({
  size = 40,
  style,
}: PersianMapHeroLogoProps) {
  return (
    <View
      accessibilityLabel="PersianMap"
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.letter,
          {
            fontSize: size * 0.46,
            lineHeight: size * 0.5,
          },
        ]}
      >
        P
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  letter: {
    fontWeight: "900",
    color: theme.colors.turquoise,
    letterSpacing: -0.5,
    marginTop: -1,
  },
});
