import { Image } from "react-native";

import type { HomeHeroSlide } from "../types/homeContentManifest.types";

/** Bundled emergency fallback when CDN playlist is empty or unreachable. */
export const BUNDLED_FALLBACK_IMAGE_ID = "korook-local-fallback";

const bundledFallbackModule = require("../../../assets/brand/korook/korook-brand-kit-reference.png");

const resolveBundledFallbackUri = (): string => {
  const resolved = Image.resolveAssetSource(bundledFallbackModule);
  return resolved?.uri ?? "";
};

let cachedBundledFallbackUri: string | null = null;

export const getBundledFallbackImageUri = (): string => {
  if (!cachedBundledFallbackUri) {
    cachedBundledFallbackUri = resolveBundledFallbackUri();
  }
  return cachedBundledFallbackUri;
};

export const createBundledFallbackSlide = (): HomeHeroSlide => ({
  id: BUNDLED_FALLBACK_IMAGE_ID,
  imageUri: getBundledFallbackImageUri(),
  title: "Korook",
  recyclingKey: `home-hero-${BUNDLED_FALLBACK_IMAGE_ID}`,
});

/** Default manifest TTL when server omits cache headers. */
export const HOME_CONTENT_MANIFEST_DEFAULT_TTL_MS = 15 * 60 * 1000;

/** Max age before in-memory snapshot is considered stale. */
export const HOME_CONTENT_SNAPSHOT_MEMORY_TTL_MS = 60 * 60 * 1000;

/** Hero carousel autoplay cap — bounds memory for large libraries. */
export const HOME_HERO_PLAYLIST_MAX_ITEMS = 60;

/** Prefetch window radius (current ± N). */
export const HOME_HERO_PREFETCH_WINDOW = 2;
