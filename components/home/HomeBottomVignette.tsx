import React from "react";
import { View } from "react-native";
import { homeLandingStyles } from "./homeLandingStyles";

const BAND_COUNT = 5;

export function HomeBottomVignette() {
  return (
    <View pointerEvents="none" style={homeLandingStyles.bottomVignette}>
      {Array.from({ length: BAND_COUNT }).map((_, index) => (
        <View
          key={`vignette-${index}`}
          style={[
            homeLandingStyles.bottomVignetteBand,
            { opacity: ((index + 1) / BAND_COUNT) * 0.72 },
          ]}
        />
      ))}
    </View>
  );
}
