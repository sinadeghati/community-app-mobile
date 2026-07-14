/** Home landing — presentation types only (no API / business models). */

export type HomeCarouselSlide = {
  id: string;
  imageUri: string;
  /** Optional editorial line — kept minimal for cinematic hero */
  title?: string;
  subtitle?: string;
  topic?: string;
};

export type HomePromotionCta = {
  label: string;
  /** Future: deep link route — UI only for now */
  route?: string;
};

export type HomeActivePromotion = {
  id: string;
  title: string;
  subtitle?: string;
  imageUri: string;
  badge?: string;
  ctas?: HomePromotionCta[];
};
