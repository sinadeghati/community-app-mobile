import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { HomeCarouselSlide } from "./homeLandingTypes";
import {
  HOME_HERO_FALLBACK_URI,
  getSlideImageUri,
} from "./homeSlideCatalog";
import { homeLandingStyles } from "./homeLandingStyles";

const KEN_BURNS_SCALE = 1.06;

type Slot = 0 | 1;
type LayerName = "a" | "b";

function HeroImageLayer({
  slide,
  layer,
  kenBurns,
  onReady,
}: {
  slide: HomeCarouselSlide;
  layer: LayerName;
  kenBurns?: Animated.Value;
  onReady?: () => void;
}) {
  const primaryUri = getSlideImageUri(slide);
  const [uri, setUri] = useState(primaryUri);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    setUri(primaryUri);
  }, [slide.id, primaryUri]);

  const emitReady = useCallback(() => {
    if (!onReady || readyRef.current) return;
    readyRef.current = true;

    if (Platform.OS === "android") {
      requestAnimationFrame(() => {
        requestAnimationFrame(onReady);
      });
      return;
    }

    onReady();
  }, [onReady]);

  const handleError = useCallback(() => {
    if (uri === HOME_HERO_FALLBACK_URI) {
      emitReady();
      return;
    }
    void Image.prefetch(HOME_HERO_FALLBACK_URI);
    setUri(HOME_HERO_FALLBACK_URI);
  }, [uri, emitReady]);

  return (
    <View style={styles.layer} collapsable={false}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          kenBurns ? { transform: [{ scale: kenBurns }] } : undefined,
        ]}
      >
        <Image
          recyclingKey={`home-hero-${layer}-${slide.id}`}
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          onLoad={emitReady}
          onError={handleError}
        />
      </Animated.View>
    </View>
  );
}

type HomeHeroCrossfadeProps = {
  visibleSlide: HomeCarouselSlide;
  targetSlide: HomeCarouselSlide;
  transitioning: boolean;
  fadeMs: number;
  onTransitionEnd: () => void;
};

export function HomeHeroCrossfade({
  visibleSlide,
  targetSlide,
  transitioning,
  fadeMs,
  onTransitionEnd,
}: HomeHeroCrossfadeProps) {
  const [frontSlot, setFrontSlot] = useState<Slot>(0);
  const [slideA, setSlideA] = useState(visibleSlide);
  const [slideB, setSlideB] = useState(visibleSlide);
  const [incomingSlot, setIncomingSlot] = useState<Slot | null>(null);
  const [backReady, setBackReady] = useState(false);

  const opacityA = useRef(new Animated.Value(1)).current;
  const opacityB = useRef(new Animated.Value(0)).current;
  const kenBurns = useRef(new Animated.Value(1)).current;
  const kenBurnsAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeStartedRef = useRef(false);
  const frontSlotRef = useRef<Slot>(0);
  const commitTargetRef = useRef<HomeCarouselSlide>(visibleSlide);

  frontSlotRef.current = frontSlot;
  const opacities = [opacityA, opacityB];

  const startKenBurns = useCallback(() => {
    kenBurnsAnimRef.current?.stop();
    kenBurns.setValue(1);
    kenBurnsAnimRef.current = Animated.timing(kenBurns, {
      toValue: KEN_BURNS_SCALE,
      duration: 6500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    kenBurnsAnimRef.current.start();
  }, [kenBurns]);

  const pauseKenBurns = useCallback(() => {
    kenBurnsAnimRef.current?.stop();
  }, []);

  const handleIncomingReady = useCallback(() => {
    setBackReady(true);
  }, []);

  const zIndexFor = useCallback(
    (slot: Slot) => {
      const topSlot = incomingSlot ?? frontSlot;
      return slot === topSlot ? 2 : 1;
    },
    [frontSlot, incomingSlot]
  );

  useEffect(() => {
    if (transitioning || incomingSlot !== null) return;

    const frontSlide = frontSlot === 0 ? slideA : slideB;
    if (frontSlide.id === visibleSlide.id) {
      startKenBurns();
      return;
    }

    if (frontSlot === 0) setSlideA(visibleSlide);
    else setSlideB(visibleSlide);
    opacities[1 - frontSlot].setValue(0);
    startKenBurns();
  }, [
    visibleSlide.id,
    transitioning,
    incomingSlot,
    frontSlot,
    slideA.id,
    slideB.id,
    startKenBurns,
    opacityA,
    opacityB,
  ]);

  useEffect(() => {
    if (!transitioning) {
      fadeStartedRef.current = false;
      return;
    }

    commitTargetRef.current = targetSlide;
    const outgoing = frontSlotRef.current;
    const incoming: Slot = outgoing === 0 ? 1 : 0;

    fadeAnimRef.current?.stop();
    fadeStartedRef.current = false;
    setBackReady(false);
    setIncomingSlot(incoming);
    pauseKenBurns();

    opacities[incoming].stopAnimation();
    opacities[incoming].setValue(0);
    opacities[outgoing].stopAnimation();
    opacities[outgoing].setValue(1);

    if (incoming === 0) setSlideA(targetSlide);
    else setSlideB(targetSlide);

    void Image.prefetch(getSlideImageUri(targetSlide));
  }, [transitioning, targetSlide.id, pauseKenBurns, opacityA, opacityB]);

  useEffect(() => {
    if (!transitioning || incomingSlot === null || backReady) return;

    const timeoutMs = Platform.OS === "android" ? 700 : 400;
    const timer = setTimeout(() => setBackReady(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [transitioning, incomingSlot, backReady, targetSlide.id]);

  useEffect(() => {
    if (!transitioning || !backReady || incomingSlot === null) return;
    if (fadeStartedRef.current) return;

    fadeStartedRef.current = true;
    const incoming = incomingSlot;
    const outgoing = frontSlotRef.current;

    fadeAnimRef.current = Animated.timing(opacities[incoming], {
      toValue: 1,
      duration: fadeMs,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    fadeAnimRef.current.start(({ finished }) => {
      if (!finished) return;

      opacities[outgoing].setValue(0);

      if (outgoing === 0) setSlideA(commitTargetRef.current);
      else setSlideB(commitTargetRef.current);

      setFrontSlot(incoming);
      setIncomingSlot(null);
      setBackReady(false);
      fadeStartedRef.current = false;
      startKenBurns();
      onTransitionEnd();
    });

    return () => {
      fadeAnimRef.current?.stop();
    };
  }, [
    transitioning,
    backReady,
    incomingSlot,
    fadeMs,
    onTransitionEnd,
    startKenBurns,
    opacityA,
    opacityB,
  ]);

  const kenBurnsActive = !transitioning && incomingSlot === null;

  return (
    <View style={styles.root} collapsable={false}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: opacityA, zIndex: zIndexFor(0) },
        ]}
      >
        <HeroImageLayer
          slide={slideA}
          layer="a"
          kenBurns={kenBurnsActive && frontSlot === 0 ? kenBurns : undefined}
          onReady={incomingSlot === 0 ? handleIncomingReady : undefined}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: opacityB, zIndex: zIndexFor(1) },
        ]}
      >
        <HeroImageLayer
          slide={slideB}
          layer="b"
          kenBurns={kenBurnsActive && frontSlot === 1 ? kenBurns : undefined}
          onReady={incomingSlot === 1 ? handleIncomingReady : undefined}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...homeLandingStyles.heroBackdrop,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
