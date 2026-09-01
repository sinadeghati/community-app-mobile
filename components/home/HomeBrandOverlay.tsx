import React from "react";
import { Text, View } from "react-native";
import { homeLandingStyles } from "./homeLandingStyles";

type HomeBrandOverlayProps = {
  topInset: number;
};

export function HomeBrandOverlay({ topInset }: HomeBrandOverlayProps) {
  return (
    <View
      style={[homeLandingStyles.wordmarkRow, { top: topInset + 36 }]}
      pointerEvents="none"
      accessible
      accessibilityLabel="Korook"
    >
      <Text style={homeLandingStyles.wordmarkDark}>KORO</Text>
      <Text style={homeLandingStyles.wordmarkAccent}>O</Text>
      <Text style={homeLandingStyles.wordmarkDark}>K</Text>
    </View>
  );
}
