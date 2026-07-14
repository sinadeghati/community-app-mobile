import type { HomeLibraryPromotion } from "../types/homeImageLibrary.types";

const isWithinSchedule = (
  promotion: HomeLibraryPromotion,
  now: Date
): boolean => {
  if (promotion.startAt) {
    const start = Date.parse(promotion.startAt);
    if (Number.isFinite(start) && now.getTime() < start) return false;
  }
  if (promotion.endAt) {
    const end = Date.parse(promotion.endAt);
    if (Number.isFinite(end) && now.getTime() > end) return false;
  }
  return true;
};

const hasRenderableBackground = (promotion: HomeLibraryPromotion): boolean =>
  Boolean(promotion.backgroundImage.mobile.url.trim());

/**
 * Returns the single winning promotion (highest priority, active, in schedule).
 * Promotions are separate from the carousel image library.
 */
export const resolveActivePromotion = (
  promotion: HomeLibraryPromotion | null | undefined,
  now: Date = new Date()
): HomeLibraryPromotion | null => {
  if (!promotion) return null;
  if (!promotion.active) return null;
  if (!isWithinSchedule(promotion, now)) return null;
  if (!hasRenderableBackground(promotion)) return null;
  return promotion;
};

export const resolveActivePromotionFromList = (
  promotions: HomeLibraryPromotion[],
  now: Date = new Date()
): HomeLibraryPromotion | null => {
  const winner = promotions
    .filter(
      (item) =>
        item.active && isWithinSchedule(item, now) && hasRenderableBackground(item)
    )
    .sort((a, b) => b.priority - a.priority)[0];

  return winner ?? null;
};
