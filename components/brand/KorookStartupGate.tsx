import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, type DimensionValue } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { korookBrand } from "../../lib/korookBrand";

const KOROOK_PIN = require("../../assets/brand/korook/korook-pin-symbol.png");

const STARTUP_MS = 950;

type KorookStartupGateProps = {
  children: React.ReactNode;
};

SplashScreen.preventAutoHideAsync().catch(() => {
  /* native splash may already be hidden in dev */
});

/**
 * Premium cold-start — pin pulse + tagline, then seamless handoff to app shell.
 */
export function KorookStartupGate({ children }: KorookStartupGateProps) {
  const [finished, setFinished] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(0.86)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0.45)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: STARTUP_MS * 0.35,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pinScale, {
          toValue: 1,
          duration: STARTUP_MS * 0.42,
          easing: Easing.out(Easing.back(1.15)),
          useNativeDriver: true,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: STARTUP_MS * 0.5,
          delay: 80,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: STARTUP_MS * 0.35,
          delay: 160,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ringScale, {
                toValue: 1.35,
                duration: STARTUP_MS * 0.55,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity, {
                toValue: 0,
                duration: STARTUP_MS * 0.55,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(ringScale, {
                toValue: 0.7,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity, {
                toValue: 0.45,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
          { iterations: 2 }
        ),
      ]),
      Animated.delay(120),
      Animated.timing(opacity, {
        toValue: 0,
        duration: STARTUP_MS * 0.22,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished: done }) => {
      if (done) setFinished(true);
    });

    return () => animation.stop();
  }, [dotsOpacity, opacity, pinScale, ringOpacity, ringScale, taglineOpacity]);

  if (finished) return <>{children}</>;

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.dotsLayer, { opacity: dotsOpacity }]}>
        {DOT_POSITIONS.map((dot, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                top: dot.top,
                left: dot.left,
                opacity: dot.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={{ opacity, alignItems: "center" }}>
        <View style={styles.pinStage}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pinScale }] }}>
            <Image
              source={KOROOK_PIN}
              style={styles.pin}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </View>

        <Text style={styles.brandName}>Korook</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          {korookBrand.tagline}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

type DotPosition = {
  top: DimensionValue;
  left: DimensionValue;
  opacity: number;
};

const DOT_POSITIONS: DotPosition[] = [
  { top: "18%", left: "14%", opacity: 0.35 },
  { top: "24%", left: "78%", opacity: 0.25 },
  { top: "68%", left: "20%", opacity: 0.2 },
  { top: "72%", left: "82%", opacity: 0.28 },
  { top: "42%", left: "8%", opacity: 0.18 },
  { top: "52%", left: "88%", opacity: 0.22 },
];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: korookBrand.colors.backgroundWarm,
  },
  dotsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: korookBrand.colors.primary,
  },
  pinStage: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: korookBrand.colors.primary,
  },
  pin: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },
  brandName: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: korookBrand.colors.navy,
  },
  tagline: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: korookBrand.colors.textSecondary,
  },
});
