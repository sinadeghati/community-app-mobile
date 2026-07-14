import React from "react";
import { Text, View } from "react-native";
import { KorookHeroLogo } from "../brand/KorookHeroLogo";
import { HOME_TAGLINE, homeLandingStyles } from "./homeLandingStyles";

type HomeBrandOverlayProps = {
  topInset: number;
};

export function HomeBrandOverlay({ topInset }: HomeBrandOverlayProps) {
  return (
    <View
      style={[homeLandingStyles.brandOverlay, { paddingTop: topInset + 10 }]}
      pointerEvents="none"
    >
      <KorookHeroLogo size={48} />
      <Text style={homeLandingStyles.brandTagline}>{HOME_TAGLINE}</Text>
    </View>
  );
}
