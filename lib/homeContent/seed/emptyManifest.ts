import { KOROOK_HOME_ART_DIRECTION_POLICY } from "../constants/homeArtDirection";
import {
  BUNDLED_FALLBACK_IMAGE_ID,
  createBundledFallbackSlide,
} from "../constants/homeContentDefaults";
import { HOME_COLLECTION_CATALOG } from "../constants/collectionCatalog";
import type { HomeContentManifest } from "../types/homeContentManifest.types";
import type { HomeLibraryImage } from "../types/homeImageLibrary.types";
import { DEFAULT_HOME_ART_DIRECTION_META } from "../constants/homeArtDirection";

const SEED_MANIFEST_VERSION = "1.0.0";

/** Placeholder image record — no CDN URLs until admin upload + publish. */
const createSeedPlaceholderImage = (
  collectionSlug: HomeLibraryImage["collectionSlug"],
  index: number
): HomeLibraryImage => {
  const padded = String(index + 1).padStart(2, "0");
  const id = `seed_${collectionSlug}_${padded}`;
  return {
    id,
    slug: `${collectionSlug}-placeholder-${padded}`,
    title: `${collectionSlug} — slot ${padded}`,
    collectionSlug,
    tags: [collectionSlug, "seed", "pending-upload"],
    description: "Reserved library slot — awaiting admin upload.",
    source: {
      type: "ai",
      name: "Korook Art Studio",
      promptVersion: "v1",
    },
    aspectRatio: "9:16",
    variants: {
      mobile: { url: "", width: 1440, height: 2560 },
    },
    active: false,
    featured: false,
    priority: 0,
    displayOrder: index,
    artDirection: DEFAULT_HOME_ART_DIRECTION_META,
  };
};

/** Generate ~200 inactive placeholder slots across collections (no image assets). */
export const buildImageLibrarySeed = (): Record<string, HomeLibraryImage> => {
  const images: Record<string, HomeLibraryImage> = {};

  for (const collection of HOME_COLLECTION_CATALOG) {
    if (collection.targetImageCount <= 0) continue;
    for (let i = 0; i < collection.targetImageCount; i += 1) {
      const image = createSeedPlaceholderImage(collection.slug, i);
      images[image.id] = image;
    }
  }

  return images;
};

const bundledFallback = createBundledFallbackSlide();

/** Bundled fallback entry referenced by manifest when playlist is empty. */
export const SEED_BUNDLED_FALLBACK_IMAGE: HomeLibraryImage = {
  id: BUNDLED_FALLBACK_IMAGE_ID,
  slug: "korook-local-fallback",
  title: bundledFallback.title ?? "Korook",
  collectionSlug: "featured",
  tags: ["fallback", "bundled"],
  description: "Bundled emergency fallback — used when CDN playlist is empty.",
  source: { type: "ai", name: "Korook Brand" },
  aspectRatio: "9:16",
  variants: {
    mobile: {
      url: bundledFallback.imageUri,
      width: 1440,
      height: 2560,
    },
  },
  active: true,
  featured: false,
  priority: 0,
  displayOrder: 0,
  artDirection: DEFAULT_HOME_ART_DIRECTION_META,
};

/**
 * Empty structural manifest for dev/staging until CDN publish.
 * Playlist is empty — Home will use bundled fallback after integration.
 */
export const createEmptyHomeContentManifest = (
  environment: HomeContentManifest["environment"] = "staging"
): HomeContentManifest => ({
  version: SEED_MANIFEST_VERSION,
  generatedAt: new Date(0).toISOString(),
  environment,
  etag: "seed-empty-v1",
  forceRefresh: false,
  collections: HOME_COLLECTION_CATALOG.map(
    ({ targetImageCount: _target, ...collection }) => collection
  ),
  hero: {
    campaignId: null,
    playlist: [],
    fallbackImageId: BUNDLED_FALLBACK_IMAGE_ID,
  },
  promotion: null,
  images: {
    [BUNDLED_FALLBACK_IMAGE_ID]: SEED_BUNDLED_FALLBACK_IMAGE,
  },
  artDirection: KOROOK_HOME_ART_DIRECTION_POLICY,
  campaigns: [],
  seasonalPacks: [],
});

export const IMAGE_LIBRARY_SEED = buildImageLibrarySeed();
