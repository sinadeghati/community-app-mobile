import React from "react";
import { Pressable, View } from "react-native";
import type { HomeCarouselSlide } from "./homeLandingTypes";
import { homeLandingStyles } from "./homeLandingStyles";

type HomeSlideIndicatorsProps = {
  slides: HomeCarouselSlide[];
  activeIndex: number;
  bottomOffset: number;
  onSelect: (index: number) => void;
};

const DOT_WINDOW = 7;

export function HomeSlideIndicators({
  slides,
  activeIndex,
  bottomOffset,
  onSelect,
}: HomeSlideIndicatorsProps) {
  if (slides.length <= 1) return null;

  const windowStart = Math.max(
    0,
    Math.min(
      activeIndex - Math.floor(DOT_WINDOW / 2),
      Math.max(0, slides.length - DOT_WINDOW)
    )
  );
  const visibleDots = slides.slice(windowStart, windowStart + DOT_WINDOW);

  return (
    <View
      style={[homeLandingStyles.indicatorsDock, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={homeLandingStyles.dotsRow}>
        {visibleDots.map((slide, offset) => {
          const index = windowStart + offset;
          const active = index === activeIndex;

          return (
            <Pressable
              key={slide.id}
              onPress={() => onSelect(index)}
              hitSlop={8}
              style={[
                homeLandingStyles.dot,
                active ? homeLandingStyles.dotActive : homeLandingStyles.dotIdle,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
            />
          );
        })}
      </View>
    </View>
  );
}
