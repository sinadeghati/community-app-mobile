import React from "react";
import { View } from "react-native";
import { homeLandingStyles } from "./homeLandingStyles";

const BAND_COUNT = 5;

/** Subtle top gradient for logo/tagline readability without hiding the photograph. */
export function HomeTopVignette() {
  return (
    <View pointerEvents="none" style={homeLandingStyles.topVignette}>
      {Array.from({ length: BAND_COUNT }).map((_, index) => (
        <View
          key={`top-vignette-${index}`}
          style={[
            homeLandingStyles.topVignetteBand,
            { opacity: ((BAND_COUNT - index) / BAND_COUNT) * 0.42 },
          ]}
        />
      ))}
    </View>
  );
}
