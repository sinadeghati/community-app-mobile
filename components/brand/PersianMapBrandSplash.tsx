import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { theme } from "../../lib/theme";
import { PersianMapLogoMark } from "./PersianMapLogoMark";

/** Set to true to enable post-login brand splash on Home (MVP: disabled). */
export const POST_LOGIN_BRAND_SPLASH_ENABLED = false;

const SPLASH_DURATION_MS = 720;

type PersianMapBrandSplashProps = {
  visible: boolean;
  onFinished: () => void;
};

/**
 * Lightweight post-login brand moment — fade + subtle scale, then hand off to Home hero.
 * Not wired in MVP. Enable via POST_LOGIN_BRAND_SPLASH_ENABLED when ready.
 */
export function PersianMapBrandSplash({
  visible,
  onFinished,
}: PersianMapBrandSplashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!visible || !POST_LOGIN_BRAND_SPLASH_ENABLED) return;

    opacity.setValue(0);
    scale.setValue(0.94);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: SPLASH_DURATION_MS * 0.55,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: SPLASH_DURATION_MS * 0.55,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(120),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_DURATION_MS * 0.35,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinished();
    });

    return () => {
      animation.stop();
    };
  }, [visible, onFinished, opacity, scale]);

  if (!POST_LOGIN_BRAND_SPLASH_ENABLED || !visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <PersianMapLogoMark size={72} variant="hero" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.deepTeal,
  },
});
