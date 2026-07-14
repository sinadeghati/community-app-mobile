import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { homeLandingStyles } from "./homeLandingStyles";

const WELCOME_VISIBLE_MS = 2600;
const WELCOME_FADE_MS = 700;

type HomeWelcomeOverlayProps = {
  visible: boolean;
  displayName: string;
  onHidden: () => void;
};

export function HomeWelcomeOverlay({
  visible,
  displayName,
  onHidden,
}: HomeWelcomeOverlayProps) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const hiddenRef = useRef(!visible);

  useEffect(() => {
    if (!visible || hiddenRef.current) return;

    opacity.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: WELCOME_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        hiddenRef.current = true;
        onHidden();
      });
    }, WELCOME_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [visible, opacity, onHidden]);

  if (!visible && hiddenRef.current) {
    return null;
  }

  const greeting =
    displayName && displayName !== "there"
      ? `Hi ${displayName} 👋`
      : "Hi 👋";

  return (
    <Animated.View
      pointerEvents="none"
      style={[homeLandingStyles.welcomeOverlay, { opacity }]}
    >
      <View style={homeLandingStyles.welcomeCard}>
        <Text style={homeLandingStyles.welcomeGreeting}>{greeting}</Text>
        <Text style={homeLandingStyles.welcomeTitle}>Welcome to Korook</Text>
        <Text style={homeLandingStyles.welcomeBody}>
          Discover the heart of the Persian community.
        </Text>
      </View>
    </Animated.View>
  );
}
