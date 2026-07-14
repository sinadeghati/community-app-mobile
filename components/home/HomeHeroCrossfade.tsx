import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { HomeCarouselSlide } from "./homeLandingTypes";
import {
  HOME_HERO_FALLBACK_URI,
  getSlideImageUri,
} from "./homeSlideCatalog";
import { homeLandingStyles } from "./homeLandingStyles";

const KEN_BURNS_SCALE = 1.06;

function HeroImageLayer({
  slide,
  layer,
  kenBurns,
  onLoad,
}: {
  slide: HomeCarouselSlide;
  layer: "base" | "top";
  kenBurns?: Animated.Value;
  onLoad?: () => void;
}) {
  const primaryUri = getSlideImageUri(slide);
  const [uri, setUri] = useState(primaryUri);

  useEffect(() => {
    setUri(primaryUri);
  }, [slide.id, primaryUri]);

  const handleError = useCallback(() => {
    if (uri === HOME_HERO_FALLBACK_URI) {
      onLoad?.();
      return;
    }
    void Image.prefetch(HOME_HERO_FALLBACK_URI);
    setUri(HOME_HERO_FALLBACK_URI);
  }, [uri, onLoad]);

  const image = (
    <Image
      recyclingKey={`home-hero-${layer}-${slide.id}`}
      source={{ uri }}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      onLoad={onLoad}
      onError={handleError}
    />
  );

  if (kenBurns) {
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: kenBurns }],
          },
        ]}
      >
        {image}
      </Animated.View>
    );
  }

  return image;
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
  const [baseSlide, setBaseSlide] = useState(visibleSlide);
  const [topSlide, setTopSlide] = useState(visibleSlide);
  const [topLoaded, setTopLoaded] = useState(true);
  const topOpacity = useRef(new Animated.Value(1)).current;
  const kenBurns = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const kenBurnsRef = useRef<Animated.CompositeAnimation | null>(null);

  const startKenBurns = useCallback(() => {
    kenBurns.setValue(1);
    kenBurnsRef.current?.stop();
    kenBurnsRef.current = Animated.timing(kenBurns, {
      toValue: KEN_BURNS_SCALE,
      duration: 6500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    kenBurnsRef.current.start();
  }, [kenBurns]);

  useEffect(() => {
    if (!transitioning) {
      setBaseSlide(visibleSlide);
      setTopSlide(visibleSlide);
      setTopLoaded(true);
      topOpacity.setValue(1);
      startKenBurns();
    }
  }, [visibleSlide.id, transitioning, topOpacity, startKenBurns]);

  useEffect(() => {
    if (!transitioning) return;

    let cancelled = false;
    animRef.current?.stop();
    topOpacity.stopAnimation();
    topOpacity.setValue(0);
    setTopLoaded(false);
    setTopSlide(targetSlide);

    void Image.prefetch(getSlideImageUri(targetSlide));

    const loadFallback = setTimeout(() => {
      if (!cancelled) setTopLoaded(true);
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(loadFallback);
    };
  }, [transitioning, targetSlide.id, topOpacity]);

  useEffect(() => {
    if (!transitioning || !topLoaded) return;

    animRef.current = Animated.timing(topOpacity, {
      toValue: 1,
      duration: fadeMs,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    animRef.current.start(({ finished }) => {
      if (!finished) return;
      setBaseSlide(targetSlide);
      setTopSlide(targetSlide);
      topOpacity.setValue(1);
      startKenBurns();
      onTransitionEnd();
    });

    return () => {
      animRef.current?.stop();
    };
  }, [
    transitioning,
    topLoaded,
    targetSlide.id,
    onTransitionEnd,
    topOpacity,
    fadeMs,
    startKenBurns,
  ]);

  return (
    <View style={[StyleSheet.absoluteFillObject, homeLandingStyles.heroBackdrop]}>
      <HeroImageLayer slide={baseSlide} layer="base" kenBurns={kenBurns} />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: transitioning ? topOpacity : 0 },
        ]}
      >
        <HeroImageLayer
          slide={topSlide}
          layer="top"
          onLoad={() => setTopLoaded(true)}
        />
      </Animated.View>
    </View>
  );
}
