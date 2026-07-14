import React from "react";
import { Image, View } from "react-native";
import { homeLandingStyles } from "./homeLandingStyles";

type HomeBrandOverlayProps = {
  topInset: number;
};

export function HomeBrandOverlay({ topInset }: HomeBrandOverlayProps) {
  return (
    <View
      style={[homeLandingStyles.brandBlock, { top: topInset + 20 }]}
      pointerEvents="none"
    >
      <Image
        source={require("../../assets/brand/korook/Korook-master-logo.png")}
        style={homeLandingStyles.brandLogo}
        resizeMode="contain"
        accessibilityLabel="Korook"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
