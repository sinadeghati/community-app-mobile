import { getApiEnvironment } from "../../apiConfig";
import type { HomeContentEnvironment } from "../types/homeContentManifest.types";

const HOME_CONTENT_CDN_BASE_URLS: Record<HomeContentEnvironment, string> = {
  development: "https://cdn.korook.com",
  staging: "https://cdn.korook.com",
  production: "https://cdn.korook.com",
};

const MANIFEST_VERSION_SEGMENT = "v1";

export const HOME_CONTENT_MANIFEST_CACHE_KEY_PREFIX = "home_content_manifest";

export const getHomeContentEnvironment = (): HomeContentEnvironment => {
  const apiEnv = getApiEnvironment();
  if (apiEnv === "development") return "development";
  if (apiEnv === "staging") return "staging";
  return "production";
};

export const getHomeContentCdnBaseUrl = (): string => {
  const override = process.env.EXPO_PUBLIC_HOME_CONTENT_CDN_BASE?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return HOME_CONTENT_CDN_BASE_URLS[getHomeContentEnvironment()];
};

export const homeContentManifestPath = (
  environment: HomeContentEnvironment = getHomeContentEnvironment()
): string =>
  `/home-content/manifests/${MANIFEST_VERSION_SEGMENT}/${environment}.json`;

export const getHomeContentManifestUrl = (
  environment: HomeContentEnvironment = getHomeContentEnvironment()
): string => `${getHomeContentCdnBaseUrl()}${homeContentManifestPath(environment)}`;

export const homeContentArtDirectionPolicyPath = (): string =>
  `/home-content/art-direction/${MANIFEST_VERSION_SEGMENT}/korook-home-style-guide.json`;

export const getHomeContentArtDirectionPolicyUrl = (): string =>
  `${getHomeContentCdnBaseUrl()}${homeContentArtDirectionPolicyPath()}`;

export const buildHomeImageVariantPath = (
  collectionSlug: string,
  imageId: string,
  variantFileName: string
): string =>
  `/home-content/images/${collectionSlug}/${imageId}/${variantFileName}`;

export const buildHomeImageVariantUrl = (
  collectionSlug: string,
  imageId: string,
  variantFileName: string
): string =>
  `${getHomeContentCdnBaseUrl()}${buildHomeImageVariantPath(
    collectionSlug,
    imageId,
    variantFileName
  )}`;

export const buildHomePromotionMediaPath = (
  promotionId: string,
  fileName: string
): string => `/home-content/promotions/${promotionId}/${fileName}`;

export const buildHomePromotionMediaUrl = (
  promotionId: string,
  fileName: string
): string =>
  `${getHomeContentCdnBaseUrl()}${buildHomePromotionMediaPath(
    promotionId,
    fileName
  )}`;
