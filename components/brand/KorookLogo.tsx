import React from "react";
import { Image, type ImageStyle, type StyleProp, View } from "react-native";
import { KOROOK_LOGO_PRIMARY } from "../../lib/korookBrand";

type KorookLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/** Official Korook lockup from brand assets — do not substitute artwork. */
export function KorookLogo({
  width = 220,
  height,
  style,
  accessibilityLabel = "Korook",
}: KorookLogoProps) {
  const aspect = 3.2;
  const resolvedHeight = height ?? Math.round(width / aspect);

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <Image
        source={KOROOK_LOGO_PRIMARY}
        style={[{ width, height: resolvedHeight, resizeMode: "contain" }, style]}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
