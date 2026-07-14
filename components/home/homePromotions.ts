/**
 * Home-only promotion mock/config.
 * No API — set `ACTIVE_HOME_PROMOTION` to preview fullscreen campaigns.
 */
import type { HomeActivePromotion } from "./homeLandingTypes";

const SAMPLE_EBI: HomeActivePromotion = {
  id: "promo-ebi-live",
  badge: "Live Concert",
  title: "Ebi Live",
  subtitle: "An unforgettable night of Persian music.",
  imageUri:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Golestan_Palace_Tehran.jpg/1280px-Golestan_Palace_Tehran.jpg",
  ctas: [
    { label: "Get Tickets", route: "/(tabs)/map" },
    { label: "Learn More", route: "/(tabs)/explore" },
  ],
};

const SAMPLE_NOWRUZ: HomeActivePromotion = {
  id: "promo-nowruz",
  badge: "Festival",
  title: "Nowruz Festival",
  subtitle: "Celebrate spring with the Persian community.",
  imageUri:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Haft-Seen.jpg/1280px-Haft-Seen.jpg",
  ctas: [{ label: "Learn More", route: "/(tabs)/explore" }],
};

/** Set to a sample constant to preview promotion mode; `null` shows AI carousel. */
export const ACTIVE_HOME_PROMOTION: HomeActivePromotion | null = null;

export const getActiveHomePromotion = (): HomeActivePromotion | null =>
  ACTIVE_HOME_PROMOTION;

export const HOME_PROMOTION_SAMPLES = {
  ebi: SAMPLE_EBI,
  nowruz: SAMPLE_NOWRUZ,
} as const;
