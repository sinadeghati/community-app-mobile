import type {
  HomeCollection,
  HomeHeroCampaign,
  HomeLibraryImage,
  HomeLibraryPromotion,
  HomeSeasonalPack,
} from "../types/homeImageLibrary.types";
import type { HomeContentManifest } from "../types/homeContentManifest.types";

/** Admin list row — lightweight grid item. */
export type AdminHomeImageListItem = Pick<
  HomeLibraryImage,
  | "id"
  | "slug"
  | "title"
  | "collectionSlug"
  | "active"
  | "featured"
  | "priority"
  | "displayOrder"
> & {
  thumbUrl: string;
  artDirectionPassed: boolean;
  updatedAt: string;
};

export type AdminHomeImageDetail = HomeLibraryImage & {
  checklistPassed: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type AdminCreateHomeImageRequest = {
  slug: string;
  title: string;
  collectionSlug: HomeLibraryImage["collectionSlug"];
  tags: string[];
  description: string;
  aspectRatio: HomeLibraryImage["aspectRatio"];
  source: HomeLibraryImage["source"];
  checklistPassed: Record<string, boolean>;
};

export type AdminUpdateHomeImageRequest = Partial<
  Omit<AdminCreateHomeImageRequest, "slug">
> & {
  active?: boolean;
  featured?: boolean;
  priority?: number;
  displayOrder?: number;
  startAt?: string | null;
  endAt?: string | null;
};

export type AdminPresignedUploadRequest = {
  collectionSlug: HomeLibraryImage["collectionSlug"];
  fileName: string;
  contentType: string;
  byteSize: number;
};

export type AdminPresignedUploadResponse = {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
};

export type AdminProcessUploadedImageRequest = {
  storageKey: string;
  imageId?: string;
  createPayload: AdminCreateHomeImageRequest;
};

export type AdminReorderImagesRequest = {
  collectionSlug?: HomeLibraryImage["collectionSlug"];
  campaignId?: string;
  orderedImageIds: string[];
};

export type AdminCollectionPayload = HomeCollection;

export type AdminPromotionPayload = HomeLibraryPromotion;

export type AdminHeroCampaignPayload = HomeHeroCampaign;

export type AdminSeasonalPackPayload = HomeSeasonalPack;

export type AdminManifestPreviewResponse = {
  manifest: HomeContentManifest;
  validationErrors: string[];
  playlistImageCount: number;
  activePromotionId: string | null;
};

export type AdminPublishManifestRequest = {
  environment: HomeContentManifest["environment"];
  note?: string;
};

export type AdminPublishManifestResponse = {
  publishedAt: string;
  manifestUrl: string;
  etag: string;
  version: string;
  purged: boolean;
};

export type AdminHomeContentDashboard = {
  activePromotionTitle: string | null;
  playlistImageCount: number;
  totalLibraryImages: number;
  activeLibraryImages: number;
  nextScheduledPromotionAt: string | null;
  lastPublishedAt: string | null;
  draftChangesPending: boolean;
};
