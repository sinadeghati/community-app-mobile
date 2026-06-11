import React from "react";
import { type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import {
  PERSIANMAP_ICON_HERO_XML,
  PERSIANMAP_ICON_LIGHT_XML,
} from "./persianMapLogoXml";

type PersianMapLogoMarkProps = {
  size?: number;
  variant?: "hero" | "app" | "light" | "dark";
  style?: ViewStyle;
};

/**
 * Option C — approved SVG assets (not programmatic placeholder).
 * hero / dark: white pin | light / app: teal pin
 */
export function PersianMapLogoMark({
  size = 44,
  variant = "hero",
  style,
}: PersianMapLogoMarkProps) {
  const height = size * (56 / 48);
  const xml =
    variant === "hero" || variant === "dark"
      ? PERSIANMAP_ICON_HERO_XML
      : PERSIANMAP_ICON_LIGHT_XML;

  return (
    <SvgXml
      xml={xml}
      width={size}
      height={height}
      style={style}
    />
  );
}
