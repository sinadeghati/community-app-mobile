import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";

const SPLASH_IMAGE = require("../../assets/brand/korook/korook-splash.brand.png");
const FADE_IN_MS = 300;
const HOLD_MS = 1000;
const FADE_OUT_MS = 500;
const SPLASH_ASPECT = 420 / 320;

type HomeBrandSplashGateProps = {
  children: React.ReactNode;
};

SplashScreen.preventAutoHideAsync().catch(() => {
  /* native splash may already be hidden in dev */
});

const AnimatedImage = Animated.createAnimatedComponent(Image);

/**
 * Premium cold-start brand card — fades in, holds, fades out, then reveals the app shell.
 */
export function HomeBrandSplashGate({ children }: HomeBrandSplashGateProps) {
  const [finished, setFinished] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const imageWidth = screenWidth * 0.78;
  const imageHeight = imageWidth * SPLASH_ASPECT;

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);

    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished: done }) => {
      if (done) setFinished(true);
    });

    return () => animation.stop();
  }, [opacity]);

  if (finished) return <>{children}</>;

  return (
    <View style={styles.screen}>
      <AnimatedImage
        source={SPLASH_IMAGE}
        style={[
          styles.brandCard,
          {
            width: imageWidth,
            height: imageHeight,
            opacity,
          },
        ]}
        resizeMode="contain"
        accessibilityLabel="Korook"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  brandCard: {
    maxWidth: "100%",
  },
});
