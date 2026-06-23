import React from "react";
import { Image, View } from "react-native";
import { KOROOK_LOGO_PRIMARY } from "../../lib/korookBrand";

type KorookHeroLogoProps = {
  size?: number;
};

/** Compact Korook pin mark for headers and list rows. */
export function KorookHeroLogo({ size = 44 }: KorookHeroLogoProps) {
  return (
    <View
      accessible
      accessibilityLabel="Korook"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Image
        source={KOROOK_LOGO_PRIMARY}
        style={{
          width: size * 1.55,
          height: size * 0.48,
          resizeMode: "contain",
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
