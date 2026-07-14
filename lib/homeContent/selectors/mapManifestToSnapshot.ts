import {
  BUNDLED_FALLBACK_IMAGE_ID,
  createBundledFallbackSlide,
} from "../constants/homeContentDefaults";
import type {
  HomeActivePromotionView,
  HomeContentManifest,
  HomeContentSnapshot,
  HomeHeroSlide,
} from "../types/homeContentManifest.types";
import type { HomeLibraryImage, HomeLibraryPromotion } from "../types/homeImageLibrary.types";
import { resolveActiveHeroPlaylist } from "./resolveActiveHeroPlaylist";
import { resolveActivePromotion } from "./resolveActivePromotion";
import { imageToHeroSlide } from "./buildPrefetchWindow";

const mapPromotionCtas = (
  promotion: HomeLibraryPromotion
): HomeActivePromotionView["ctas"] => {
  if (!promotion.cta?.enabled) return [];
  const { label, linkType, linkValue } = promotion.cta;
  if (linkType === "external_url") {
    return [{ label, externalUrl: linkValue }];
  }
  return [{ label, route: linkValue }];
};

const mapPromotionToView = (
  promotion: HomeLibraryPromotion
): HomeActivePromotionView => ({
  id: promotion.id,
  title: promotion.title,
  subtitle: promotion.subtitle,
  badge: promotion.badge,
  imageUri: promotion.backgroundImage.mobile.url,
  videoUri: promotion.backgroundVideo?.url,
  ctas: mapPromotionCtas(promotion),
});

const resolveFallbackSlide = (
  manifest: HomeContentManifest
): HomeHeroSlide => {
  const fallbackId = manifest.hero.fallbackImageId;
  const fallbackImage = manifest.images[fallbackId];

  if (fallbackImage?.variants.mobile.url.trim()) {
    return imageToHeroSlide(fallbackImage);
  }

  if (fallbackId === BUNDLED_FALLBACK_IMAGE_ID) {
    return createBundledFallbackSlide();
  }

  return createBundledFallbackSlide();
};

export const mapManifestToSnapshot = (
  manifest: HomeContentManifest,
  source: HomeContentSnapshot["source"]
): HomeContentSnapshot => {
  const activeImages = resolveActiveHeroPlaylist(manifest);
  const heroSlides = activeImages.map(imageToHeroSlide);
  const fallbackSlide = resolveFallbackSlide(manifest);
  const activePromotionRecord = resolveActivePromotion(manifest.promotion);

  return {
    version: manifest.version,
    etag: manifest.etag,
    generatedAt: manifest.generatedAt,
    environment: manifest.environment,
    heroSlides: heroSlides.length ? heroSlides : [fallbackSlide],
    activePromotion: activePromotionRecord
      ? mapPromotionToView(activePromotionRecord)
      : null,
    fallbackSlide,
    source,
  };
};

export const resolveImageFromManifest = (
  manifest: HomeContentManifest,
  imageId: string
): HomeLibraryImage | null => manifest.images[imageId] ?? null;
