import {
  buildHomeImageVariantPath,
  buildHomeImageVariantUrl,
  buildHomePromotionMediaPath,
  buildHomePromotionMediaUrl,
  getHomeContentCdnBaseUrl,
  homeContentManifestPath,
} from "../constants/homeContentCdn";

export const HOME_IMAGE_VARIANT_FILES = {
  original: "original.webp",
  mobile1080: "mobile-1080.webp",
  mobile1440: "mobile-1440.webp",
  tablet2048: "tablet-2048.webp",
  thumb320: "thumb-320.webp",
} as const;

export const HOME_PROMOTION_MEDIA_FILES = {
  heroMobile: "hero-mobile.webp",
  heroTablet: "hero-tablet.webp",
  video: "optional-video.mp4",
} as const;

export const cdnPaths = {
  manifest: (environment: string): string => homeContentManifestPath(environment as "staging"),
  imageVariant: (
    collectionSlug: string,
    imageId: string,
    variantFileName: string
  ): string => buildHomeImageVariantPath(collectionSlug, imageId, variantFileName),
  promotionMedia: (promotionId: string, fileName: string): string =>
    buildHomePromotionMediaPath(promotionId, fileName),
};

export const cdnUrls = {
  base: (): string => getHomeContentCdnBaseUrl(),
  imageVariant: (
    collectionSlug: string,
    imageId: string,
    variantFileName: string
  ): string => buildHomeImageVariantUrl(collectionSlug, imageId, variantFileName),
  promotionMedia: (promotionId: string, fileName: string): string =>
    buildHomePromotionMediaUrl(promotionId, fileName),
};
