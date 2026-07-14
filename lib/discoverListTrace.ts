import {
  type DiscoverableListing,
  getListingId,
  isEventListing,
} from "./discoverableListings";
import type { DisplayableListingContext } from "./businessListingVisibility";

export const businessIdsFrom = (items: DiscoverableListing[]): string[] =>
  items
    .filter((item) => !isEventListing(item))
    .map(getListingId)
    .filter(Boolean);

export const logDiscoverListStage = (
  stage: string,
  items: DiscoverableListing[],
  extra?: Record<string, unknown>
): void => {
  const businessIds = businessIdsFrom(items);
  console.log("[discover-trace]", stage, {
    count: items.length,
    businessCount: businessIds.length,
    businessIds,
    ...extra,
  });
};

export const logDiscoverContextStage = (
  stage: string,
  context: DisplayableListingContext
): void => {
  console.log("[discover-trace]", stage, {
    userId: context.userId ?? null,
    ownedCount: context.ownedIds.size,
    ownedIds: [...context.ownedIds],
    profileStorageCount: context.profileStorageIds.size,
    profileStorageIds: [...context.profileStorageIds],
    deletedCount: context.deletedIds.size,
    deletedIds: [...context.deletedIds],
  });
};

export const logDiscoverIdStage = (
  stage: string,
  businessIds: string[],
  extra?: Record<string, unknown>
): void => {
  console.log("[discover-trace]", stage, {
    businessCount: businessIds.length,
    businessIds,
    ...extra,
  });
};

export const logExploreUiStage = (
  stage: string,
  items: Array<{ id?: string | number | null }>,
  meta: {
    source: string;
    inputIds?: string[];
    removedIds?: string[];
    extra?: Record<string, unknown>;
  }
): void => {
  const businessIds = items
    .map((item) => String(item?.id ?? ""))
    .filter(Boolean);
  console.log("[explore-ui-trace]", stage, {
    count: items.length,
    businessIds,
    source: meta.source,
    inputIds: meta.inputIds,
    removedIds: meta.removedIds,
    removedCount: meta.removedIds?.length ?? 0,
    ...meta.extra,
  });
};
