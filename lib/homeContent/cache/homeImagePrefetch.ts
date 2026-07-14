import { Image } from "expo-image";

import type { HomeHeroSlide } from "../types/homeContentManifest.types";
import { buildPrefetchWindow, getHeroSlideImageUri } from "../selectors/buildPrefetchWindow";
import { createBundledFallbackSlide } from "../constants/homeContentDefaults";

const prefetchUri = async (uri: string): Promise<void> => {
  const trimmed = uri.trim();
  if (!trimmed) return;
  try {
    await Image.prefetch(trimmed);
  } catch {
    // Best-effort prefetch — hero still renders with onError fallback.
  }
};

export const prefetchHeroSlideUris = async (uris: string[]): Promise<void> => {
  await Promise.all(uris.map((uri) => prefetchUri(uri)));
};

export const prefetchHeroSlidesAround = async (
  slides: HomeHeroSlide[],
  centerIndex: number,
  windowSize?: number
): Promise<void> => {
  const uris = buildPrefetchWindow(slides, centerIndex, windowSize);
  if (!uris.length) {
    await prefetchUri(createBundledFallbackSlide().imageUri);
    return;
  }
  await prefetchHeroSlideUris(uris);
};

export const prefetchHeroSlide = async (slide: HomeHeroSlide): Promise<void> => {
  await prefetchUri(getHeroSlideImageUri(slide));
};
