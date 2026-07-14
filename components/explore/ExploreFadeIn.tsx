import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

type ExploreFadeInProps = {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
};

export function ExploreFadeIn({
  children,
  delay = 0,
  style,
}: ExploreFadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
