import type {
  HomeArtDirectionMeta,
  HomeCollection,
  HomeCollectionSlug,
  HomeHeroCampaign,
  HomeLibraryImage,
  HomeLibraryPromotion,
  HomeSeasonalPack,
} from "./homeImageLibrary.types";

export type HomeContentEnvironment =
  | "development"
  | "staging"
  | "production";

/** Slim manifest — playlist references image IDs; only needed images are inlined. */
export type HomeContentManifestPlaylistItem = {
  imageId: string;
  weight?: number;
};

export type HomeContentManifestHero = {
  campaignId: string | null;
  playlist: HomeContentManifestPlaylistItem[];
  fallbackImageId: string;
};

export type HomeContentArtDirectionPolicy = HomeArtDirectionMeta & {
  name: string;
  description: string;
  masterMinWidth: number;
  masterMinHeight: number;
  mobileDeliveryWidth: number;
  mobileDeliveryHeight: number;
  forbiddenElements: string[];
};

export type HomeContentManifest = {
  version: string;
  generatedAt: string;
  environment: HomeContentEnvironment;
  etag: string;
  forceRefresh?: boolean;
  collections: HomeCollection[];
  hero: HomeContentManifestHero;
  promotion: HomeLibraryPromotion | null;
  images: Record<string, HomeLibraryImage>;
  artDirection: HomeContentArtDirectionPolicy;
  campaigns?: HomeHeroCampaign[];
  seasonalPacks?: HomeSeasonalPack[];
};

/** Presentation DTO — what Home UI will consume after integration. */
export type HomeHeroSlide = {
  id: string;
  imageUri: string;
  title?: string;
  subtitle?: string;
  recyclingKey: string;
};

export type HomeActivePromotionView = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUri: string;
  videoUri?: string;
  ctas: Array<{
    label: string;
    route?: string;
    externalUrl?: string;
  }>;
};

export type HomeContentSnapshot = {
  version: string;
  etag: string;
  generatedAt: string;
  environment: HomeContentEnvironment;
  heroSlides: HomeHeroSlide[];
  activePromotion: HomeActivePromotionView | null;
  fallbackSlide: HomeHeroSlide;
  source: "cache" | "cdn" | "bundled";
};

export type HomeContentManifestFetchResult =
  | {
      status: "ok";
      manifest: HomeContentManifest;
      etag: string;
      fromCache: boolean;
    }
  | {
      status: "not_modified";
      etag: string;
      fromCache: boolean;
    };

export type HomeContentImageLookup = Record<string, HomeLibraryImage>;

export type HomePlaylistResolutionContext = {
  now?: Date;
  images: HomeContentImageLookup;
  campaigns?: HomeHeroCampaign[];
  seasonalPacks?: HomeSeasonalPack[];
  defaultCollectionSlugs?: HomeCollectionSlug[];
};
