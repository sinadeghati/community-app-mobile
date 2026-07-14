import type {
  HomeContentManifest,
  HomePlaylistResolutionContext,
} from "../types/homeContentManifest.types";
import type { HomeLibraryImage } from "../types/homeImageLibrary.types";
import { HOME_HERO_PLAYLIST_MAX_ITEMS } from "../constants/homeContentDefaults";
import { getDefaultRotationCollectionSlugs } from "../constants/collectionCatalog";

const isWithinSchedule = (
  image: HomeLibraryImage,
  now: Date
): boolean => {
  if (image.startAt) {
    const start = Date.parse(image.startAt);
    if (Number.isFinite(start) && now.getTime() < start) return false;
  }
  if (image.endAt) {
    const end = Date.parse(image.endAt);
    if (Number.isFinite(end) && now.getTime() > end) return false;
  }
  return true;
};

const comparePlaylistImages = (
  a: HomeLibraryImage,
  b: HomeLibraryImage
): number => {
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return a.slug.localeCompare(b.slug);
};

const isCampaignWithinSchedule = (
  campaign: { startAt?: string | null; endAt?: string | null },
  now: Date
): boolean => isWithinSchedule(campaign as HomeLibraryImage, now);

const resolveActiveCampaignPlaylist = (
  manifest: HomeContentManifest,
  now: Date
): string[] | null => {
  const campaigns = manifest.campaigns ?? [];
  const active = campaigns
    .filter(
      (campaign) => campaign.active && isCampaignWithinSchedule(campaign, now)
    )
    .sort((a, b) => b.priority - a.priority);

  const winner = active[0];
  if (!winner?.playlist?.length) return null;

  return winner.playlist.map((item) => item.imageId);
};

const resolveDefaultRotationPlaylist = (
  images: Record<string, HomeLibraryImage>,
  now: Date,
  defaultCollectionSlugs: string[]
): string[] => {
  const slugSet = new Set(defaultCollectionSlugs);
  const candidates = Object.values(images)
    .filter(
      (image) =>
        image.active &&
        !image.archivedAt &&
        isWithinSchedule(image, now) &&
        (image.featured || slugSet.has(image.collectionSlug))
    )
    .sort(comparePlaylistImages);

  return candidates.map((image) => image.id);
};

const resolveManifestPlaylistIds = (
  manifest: HomeContentManifest,
  now: Date
): string[] => {
  if (manifest.hero.playlist.length > 0) {
    return manifest.hero.playlist.map((item) => item.imageId);
  }

  const campaignIds = resolveActiveCampaignPlaylist(manifest, now);
  if (campaignIds?.length) return campaignIds;

  return resolveDefaultRotationPlaylist(
    manifest.images,
    now,
    getDefaultRotationCollectionSlugs()
  );
};

/**
 * Resolves ordered hero image IDs from manifest + scheduling rules.
 * Caps at HOME_HERO_PLAYLIST_MAX_ITEMS for memory safety.
 */
export const resolveActiveHeroPlaylist = (
  manifest: HomeContentManifest,
  context: HomePlaylistResolutionContext = { images: manifest.images }
): HomeLibraryImage[] => {
  const now = context.now ?? new Date();
  const imageLookup = context.images;
  const orderedIds = resolveManifestPlaylistIds(manifest, now);

  const resolved: HomeLibraryImage[] = [];
  for (const imageId of orderedIds) {
    const image = imageLookup[imageId];
    if (!image || !image.active || image.archivedAt) continue;
    if (!isWithinSchedule(image, now)) continue;
  if (!image.variants.mobile.url.trim()) continue;
    resolved.push(image);
    if (resolved.length >= HOME_HERO_PLAYLIST_MAX_ITEMS) break;
  }

  return resolved;
};

export const resolveHeroImageIds = (
  manifest: HomeContentManifest,
  context?: HomePlaylistResolutionContext
): string[] => resolveActiveHeroPlaylist(manifest, context).map((image) => image.id);
