/** Home Image Library — domain types (admin + manifest). */

export type HomeCollectionSlug =
  | "tehran"
  | "isfahan"
  | "shiraz"
  | "yazd"
  | "persepolis"
  | "persian-architecture"
  | "persian-gardens"
  | "persian-mountains"
  | "persian-desert"
  | "caspian-sea"
  | "persian-food"
  | "persian-cafes"
  | "luxury-restaurants"
  | "persian-culture"
  | "persian-art"
  | "persian-calligraphy"
  | "festivals"
  | "concerts"
  | "night-life"
  | "seasonal"
  | "featured"
  | "promotions";

export type HomeAspectRatio = "9:16" | "16:9" | "4:5";

export type HomeImageSourceType = "ai" | "photographer";

export type HomeImageSource = {
  type: HomeImageSourceType;
  name: string;
  promptVersion?: string;
  license?: string;
};

export type HomeImageVariant = {
  url: string;
  width: number;
  height: number;
  bytes?: number;
};

export type HomeImageVariants = {
  mobile: HomeImageVariant;
  tablet?: HomeImageVariant;
  thumb?: HomeImageVariant;
};

export type HomeArtDirectionMeta = {
  styleVersion: string;
  ultraRealistic: boolean;
  hdr: boolean;
  goldenHour: boolean;
  noText: boolean;
  noWatermark: boolean;
  noLogo: boolean;
};

export type HomeLibraryImage = {
  id: string;
  slug: string;
  title: string;
  collectionSlug: HomeCollectionSlug;
  tags: string[];
  description: string;
  source: HomeImageSource;
  aspectRatio: HomeAspectRatio;
  variants: HomeImageVariants;
  active: boolean;
  featured: boolean;
  priority: number;
  displayOrder: number;
  startAt?: string | null;
  endAt?: string | null;
  artDirection: HomeArtDirectionMeta;
  archivedAt?: string | null;
};

export type HomePromotionType =
  | "concert"
  | "festival"
  | "nowruz"
  | "sponsor_campaign"
  | "restaurant_promotion"
  | "business_promotion"
  | "movie"
  | "live_event"
  | "community_announcement";

export type HomePromotionLinkType =
  | "internal_route"
  | "external_url"
  | "deep_link";

export type HomePromotionCta = {
  enabled: boolean;
  label: string;
  linkType: HomePromotionLinkType;
  linkValue: string;
};

export type HomePromotionVideo = {
  url: string;
  posterUrl?: string;
};

export type HomeLibraryPromotion = {
  id: string;
  slug: string;
  type: HomePromotionType;
  title: string;
  subtitle?: string;
  badge?: string;
  backgroundImage: HomeImageVariants;
  backgroundVideo?: HomePromotionVideo;
  cta?: HomePromotionCta;
  priority: number;
  active: boolean;
  startAt?: string | null;
  endAt?: string | null;
  targetPlatforms?: Array<"ios" | "android" | "web">;
};

export type HomeCollection = {
  id: string;
  slug: HomeCollectionSlug;
  title: string;
  description?: string;
  defaultRotationWeight: number;
  displayOrder: number;
  active: boolean;
};

export type HomeHeroCampaign = {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  priority: number;
  startAt?: string | null;
  endAt?: string | null;
  playlist: Array<{ imageId: string; weight?: number }>;
};

export type HomeSeasonalPack = {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  startAt: string;
  endAt: string;
  imageIds: string[];
};
