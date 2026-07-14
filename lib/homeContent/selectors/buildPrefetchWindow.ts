import type { HomeHeroSlide } from "../types/homeContentManifest.types";
import type { HomeLibraryImage } from "../types/homeImageLibrary.types";
import { HOME_HERO_PREFETCH_WINDOW } from "../constants/homeContentDefaults";

export const getHeroSlideImageUri = (slide: HomeHeroSlide): string =>
  slide.imageUri.trim();

export const imageToHeroSlide = (image: HomeLibraryImage): HomeHeroSlide => ({
  id: image.id,
  imageUri: image.variants.mobile.url,
  title: image.title,
  recyclingKey: `home-hero-${image.id}`,
});

/**
 * Prefetch window: current index ± windowSize (memory-safe for large catalogs).
 */
export const buildPrefetchWindow = (
  slides: HomeHeroSlide[],
  centerIndex: number,
  windowSize: number = HOME_HERO_PREFETCH_WINDOW
): string[] => {
  if (!slides.length) return [];

  const uris = new Set<string>();
  for (let offset = 0; offset <= windowSize; offset += 1) {
    const next = slides[(centerIndex + offset) % slides.length];
    const prev =
      slides[(centerIndex - offset + slides.length) % slides.length];
    if (next) {
      const uri = getHeroSlideImageUri(next);
      if (uri) uris.add(uri);
    }
    if (prev) {
      const uri = getHeroSlideImageUri(prev);
      if (uri) uris.add(uri);
    }
  }
  return [...uris];
};

export const buildPrefetchWindowFromImages = (
  images: HomeLibraryImage[],
  centerIndex: number,
  windowSize: number = HOME_HERO_PREFETCH_WINDOW
): string[] =>
  buildPrefetchWindow(
    images.map(imageToHeroSlide),
    centerIndex,
    windowSize
  );
