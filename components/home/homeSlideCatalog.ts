/**
 * Home-only hero slide catalog.
 *
 * Premium preview: local bundled assets under assets/home/premium-hero/.
 * Replace placeholder .jpg files with final art — no code change required.
 */
import { Image } from "react-native";

import type { HomeCarouselSlide } from "./homeLandingTypes";

const PREMIUM_HERO_MODULES = {
  HERO_002: require("../../assets/home/premium-hero/HERO_002.jpg"),
  HERO_003: require("../../assets/home/premium-hero/HERO_003.jpg"),
  HERO_004: require("../../assets/home/premium-hero/HERO_004.jpg"),
  HERO_006: require("../../assets/home/premium-hero/HERO_006.jpg"),
  HERO_007: require("../../assets/home/premium-hero/HERO_007.jpg"),
} as const;

const resolveLocalAssetUri = (moduleId: number): string =>
  Image.resolveAssetSource(moduleId)?.uri?.trim() ?? "";

export const HOME_PREMIUM_HERO_URIS = {
  HERO_002: resolveLocalAssetUri(PREMIUM_HERO_MODULES.HERO_002),
  HERO_003: resolveLocalAssetUri(PREMIUM_HERO_MODULES.HERO_003),
  HERO_004: resolveLocalAssetUri(PREMIUM_HERO_MODULES.HERO_004),
  HERO_006: resolveLocalAssetUri(PREMIUM_HERO_MODULES.HERO_006),
  HERO_007: resolveLocalAssetUri(PREMIUM_HERO_MODULES.HERO_007),
} as const;

/** Bundled fallback — Persepolis slot until all assets are present. */
export const HOME_HERO_FALLBACK_URI = HOME_PREMIUM_HERO_URIS.HERO_006;

/** Premium hero playlist (preview set). */
export const HOME_SLIDE_CATALOG: HomeCarouselSlide[] = [
  {
    id: "hero-002",
    topic: "Premium Hero",
    title: "HERO_002",
    imageUri: HOME_PREMIUM_HERO_URIS.HERO_002,
  },
  {
    id: "hero-003",
    topic: "Premium Hero",
    title: "HERO_003",
    imageUri: HOME_PREMIUM_HERO_URIS.HERO_003,
  },
  {
    id: "hero-004",
    topic: "Premium Hero",
    title: "HERO_004",
    imageUri: HOME_PREMIUM_HERO_URIS.HERO_004,
  },
  {
    id: "hero-006",
    topic: "Persepolis",
    title: "Persepolis",
    subtitle: "Ancient Persia",
    imageUri: HOME_PREMIUM_HERO_URIS.HERO_006,
  },
  {
    id: "hero-007",
    topic: "Hafez Tomb",
    title: "Hafez Tomb",
    subtitle: "Shiraz",
    imageUri: HOME_PREMIUM_HERO_URIS.HERO_007,
  },
];

export const HOME_FALLBACK_SLIDE: HomeCarouselSlide = {
  id: "fallback-hero-006",
  title: "Welcome to Korook",
  subtitle: "Discover the heart of the Persian community.",
  imageUri: HOME_HERO_FALLBACK_URI,
};

export const getSlideImageUri = (slide: HomeCarouselSlide): string =>
  slide.imageUri?.trim() || HOME_HERO_FALLBACK_URI;

const isRenderableSlideUri = (uri: string): boolean => uri.length > 0;

/**
 * Active carousel playlist — filter invalid rows; never blocks Home render.
 */
export const getHomeCarouselSlides = (): HomeCarouselSlide[] => {
  const slides = HOME_SLIDE_CATALOG.filter(
    (slide) =>
      Boolean(slide.id?.trim()) &&
      isRenderableSlideUri(getSlideImageUri(slide))
  );

  return slides.length > 0 ? slides : [HOME_FALLBACK_SLIDE];
};

/** Prefetch window: current + next N slides (memory-safe for large catalogs). */
export const getPrefetchSlideUris = (
  slides: HomeCarouselSlide[],
  centerIndex: number,
  windowSize = 2
): string[] => {
  if (!slides.length) return [HOME_HERO_FALLBACK_URI];

  const uris = new Set<string>();
  for (let offset = 0; offset <= windowSize; offset += 1) {
    const next = slides[(centerIndex + offset) % slides.length];
    const prev = slides[(centerIndex - offset + slides.length) % slides.length];
    if (next) uris.add(getSlideImageUri(next));
    if (prev) uris.add(getSlideImageUri(prev));
  }
  return [...uris];
};
