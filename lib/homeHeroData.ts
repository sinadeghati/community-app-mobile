/** Reliable fallback when a remote hero image fails to load — Persepolis, never stock/hotel */
export const HOME_HERO_FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_53.jpg/1280px-Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_53.jpg";

/**
 * Home Hero — premium editorial front page for PersianMap.
 *
 * PRODUCT RULE (do not violate):
 * - Home Hero is NOT a generic ad slot. It must never feel like Craigslist.
 * - Default carousel: Iran culture/history/nature, Community Spotlight, Photo of the Week.
 * - Paid/event slides appear ONLY when explicitly approved (admin/founder), never from listings.
 * - Do NOT auto-pull businesses, mechanics, insurance, real estate, or Explore listings into Hero.
 * - Regular business promotion belongs in Explore featured, sponsored cards, Map promos, category pages.
 *
 * MVP: local config only. Post–private-beta: admin selects heroApproved placements.
 */

import {
  IRAN_HERO_SLIDE_SEEDS,
  type IranHeroSlideSeed,
} from "./homeHeroIranSlides";

/** Where this slide belongs in the PersianMap editorial system */
export type HomeHeroChannel =
  | "editorial_culture"
  | "community_spotlight"
  | "photo_of_week"
  | "event_teaser"
  | "curated_event"
  | "premium_placement";

/** Legacy display type — NOT used to infer ads from listings */
export type HomeHeroType = "event" | "business" | "spotlight" | "photo";

/** @deprecated Use channel — kept for normalize/API compat */
export type HomeHeroTier = HomeHeroChannel;

export type HomeHeroItem = {
  id: string;
  channel: HomeHeroChannel;
  type: HomeHeroType;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  targetRoute?: string;
  targetId?: string;
  startsAt?: string;
  endsAt?: string;
  /** Master on/off — still requires channel eligibility rules */
  isActive: boolean;
  /**
   * Required for curated_event & premium_placement.
   * Founder/admin must explicitly approve — never set by listing sync.
   */
  heroApproved?: boolean;
};

export const getHeroImagePrimaryUri = (slide: HomeHeroItem): string =>
  slide.image?.trim() || HOME_HERO_FALLBACK_IMAGE;

/** Guaranteed slide when the editorial playlist filters to empty — Home must never block. */
export const HOME_HERO_FALLBACK_SLIDE: HomeHeroItem = {
  id: "fallback-persepolis",
  channel: "editorial_culture",
  type: "photo",
  title: "Welcome to PersianMap",
  subtitle: "Discover Iranian businesses, events, and community near you.",
  image: HOME_HERO_FALLBACK_IMAGE,
  ctaLabel: "Explore",
  targetRoute: "/(tabs)/explore",
  isActive: true,
};

export const logHeroImageLoadFailure = (
  slideId: string,
  slideTitle: string,
  failedUri: string
): void => {
  console.warn(
    `[HomeHero] Image load failed — slide="${slideTitle}" id=${slideId} uri=${failedUri}`
  );
};

const mapCultureSlide = (seed: IranHeroSlideSeed): HomeHeroItem => ({
  id: seed.id,
  channel: "editorial_culture",
  type: "photo",
  title: seed.title,
  subtitle: seed.subtitle,
  image: seed.image,
  ctaLabel: "Explore",
  targetRoute: "/(tabs)/explore",
  isActive: true,
});

/** DEFAULT — Iran culture / history / nature (bulk of rotation) */
export const HOME_HERO_CULTURE_ITEMS: HomeHeroItem[] =
  IRAN_HERO_SLIDE_SEEDS.map(mapCultureSlide);

/** DEFAULT — Community Spotlight (editorial, not a business ad) */
export const HOME_HERO_COMMUNITY_SPOTLIGHT_ITEMS: HomeHeroItem[] = [
  {
    id: "spotlight-masuleh",
    channel: "community_spotlight",
    type: "spotlight",
    title: "Community Spotlight",
    subtitle: "Persian villages and living heritage across Iran.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Masuleh_2018_2.jpg/1280px-Masuleh_2018_2.jpg",
    ctaLabel: "Explore community",
    targetRoute: "/(tabs)/explore",
    isActive: true,
  },
];

/** DEFAULT — Photo of the Week (community editorial) */
export const HOME_HERO_PHOTO_OF_WEEK_ITEMS: HomeHeroItem[] = [
  {
    id: "potw-sheikh-lotfollah",
    channel: "photo_of_week",
    type: "photo",
    title: "Photo of the Week",
    subtitle: "Sheikh Lotfollah Mosque — light and geometry in Isfahan.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Isfahan_Lotfollah_mosque_ceiling_symmetric.jpg/1280px-Isfahan_Lotfollah_mosque_ceiling_symmetric.jpg",
    ctaLabel: "See more",
    targetRoute: "/(tabs)/explore",
    isActive: true,
  },
];

/** MVP event teasers — editorial only, no backend or ticketing */
export const HOME_HERO_EVENT_TEASER_ITEMS: HomeHeroItem[] = [
  {
    id: "teaser-persian-festival",
    channel: "event_teaser",
    type: "event",
    title: "Persian Festival",
    subtitle: "COMING SOON — celebrations across the community.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Naghshe_Jahan_Square_Isfahan_modified.jpg/1280px-Naghshe_Jahan_Square_Isfahan_modified.jpg",
    ctaLabel: "Coming soon",
    targetRoute: "/(tabs)/map",
    isActive: true,
  },
  {
    id: "teaser-concert-night",
    channel: "event_teaser",
    type: "event",
    title: "Concert Night",
    subtitle: "COMING SOON — live Persian music and culture.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Golestan_Palace_Tehran.jpg/1280px-Golestan_Palace_Tehran.jpg",
    ctaLabel: "Coming soon",
    targetRoute: "/(tabs)/map",
    isActive: true,
  },
  {
    id: "teaser-nowruz",
    channel: "event_teaser",
    type: "event",
    title: "Nowruz Celebration",
    subtitle: "COMING SOON — spring gatherings and haft-seen traditions.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Haft-Seen.jpg/1280px-Haft-Seen.jpg",
    ctaLabel: "Coming soon",
    targetRoute: "/(tabs)/map",
    isActive: true,
  },
  {
    id: "teaser-community-event",
    channel: "event_teaser",
    type: "event",
    title: "Community Event",
    subtitle: "COMING SOON — connect with your Persian community nearby.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Masuleh_2018_2.jpg/1280px-Masuleh_2018_2.jpg",
    ctaLabel: "Coming soon",
    targetRoute: "/(tabs)/map",
    isActive: true,
  },
];

/**
 * INTENTIONAL ONLY — major concerts, festivals, Nowruz/Yalda, large community events.
 * isActive + heroApproved must both be true. Never synced from map/listing data.
 */
export const HOME_HERO_CURATED_EVENT_ITEMS: HomeHeroItem[] = [
  {
    id: "curated-nowruz-season",
    channel: "curated_event",
    type: "event",
    title: "Nowruz celebrations",
    subtitle: "Spring festivals across the Persian community.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Haft-Seen.jpg/1280px-Haft-Seen.jpg",
    ctaLabel: "See events",
    targetRoute: "/(tabs)/map",
    startsAt: "2026-02-15T00:00:00.000Z",
    endsAt: "2026-04-15T23:59:59.000Z",
    isActive: true,
    heroApproved: true,
  },
  {
    id: "curated-yalda-evening",
    channel: "curated_event",
    type: "event",
    title: "Yalda Night",
    subtitle: "Winter gatherings — poetry, pomegranate, and community.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Haft-Seen.jpg/1280px-Haft-Seen.jpg",
    ctaLabel: "See events",
    targetRoute: "/(tabs)/map",
    isActive: false,
    heroApproved: false,
  },
];

/**
 * INTENTIONAL ONLY — premium paid hero placements approved by admin/founder.
 * NOT for regular businesses (mechanic, insurance, real estate, etc.).
 */
export const HOME_HERO_PREMIUM_PLACEMENT_ITEMS: HomeHeroItem[] = [
  {
    id: "premium-placeholder",
    channel: "premium_placement",
    type: "business",
    title: "Premium placement",
    subtitle: "Reserved for founder-approved hero campaigns only.",
    image: HOME_HERO_FALLBACK_IMAGE,
    ctaLabel: "Learn more",
    targetRoute: "/(tabs)/explore",
    isActive: false,
    heroApproved: false,
  },
];

/** Full catalog — never feed this directly to Home; use getActiveHomeHeroSlides() */
export const HOME_HERO_ITEMS: HomeHeroItem[] = [
  ...HOME_HERO_PHOTO_OF_WEEK_ITEMS,
  ...HOME_HERO_COMMUNITY_SPOTLIGHT_ITEMS,
  ...HOME_HERO_CULTURE_ITEMS,
  ...HOME_HERO_EVENT_TEASER_ITEMS,
  ...HOME_HERO_CURATED_EVENT_ITEMS,
  ...HOME_HERO_PREMIUM_PLACEMENT_ITEMS,
];

export const HOME_HERO_CHANNEL_LABELS: Record<HomeHeroChannel, string> = {
  editorial_culture: "Persian Heritage",
  community_spotlight: "Community Spotlight",
  photo_of_week: "Photo of the Week",
  event_teaser: "Coming Soon",
  curated_event: "Featured Event",
  premium_placement: "PersianMap Presents",
};

/** @deprecated Use HOME_HERO_CHANNEL_LABELS */
export const HOME_HERO_TIER_LABELS = HOME_HERO_CHANNEL_LABELS;

export const HOME_HERO_TYPE_LABELS: Record<HomeHeroType, string> = {
  event: "Event",
  business: "Premium",
  spotlight: "Community",
  photo: "Culture",
};

/** Insert event teaser slides every N culture slides */
const EVENT_TEASER_INTERVAL = 6;

const isWithinSchedule = (item: HomeHeroItem, now: number): boolean => {
  if (item.startsAt) {
    const start = new Date(item.startsAt).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }

  if (item.endsAt) {
    const end = new Date(item.endsAt).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }

  return true;
};

/**
 * Editorial eligibility — blocks listing-style business ads from Hero.
 * Listings / Explore / Map must never call this with auto-generated items.
 */
export const isEligibleForHomeHero = (item: HomeHeroItem): boolean => {
  if (item.type === "business" && item.channel !== "premium_placement") {
    return false;
  }

  switch (item.channel) {
    case "editorial_culture":
    case "community_spotlight":
    case "photo_of_week":
    case "event_teaser":
      return true;
    case "curated_event":
    case "premium_placement":
      return item.heroApproved === true;
    default:
      return false;
  }
};

const filterActiveHeroItems = (
  items: HomeHeroItem[],
  ts: number
): HomeHeroItem[] =>
  items.filter(
    (item) =>
      item.isActive && isWithinSchedule(item, ts) && isEligibleForHomeHero(item)
  );

/**
 * Home carousel playlist:
 * - Default = Iran heritage + community editorial (spotlight, photo of week)
 * - Approved event ads interleaved occasionally between culture slides
 * - Business / premium placements never unless founder-approved (none in MVP)
 */
export const getActiveHomeHeroSlides = (now: Date = new Date()): HomeHeroItem[] => {
  const ts = now.getTime();

  const culture = filterActiveHeroItems(HOME_HERO_CULTURE_ITEMS, ts);
  const spotlight = filterActiveHeroItems(HOME_HERO_COMMUNITY_SPOTLIGHT_ITEMS, ts);
  const photoOfWeek = filterActiveHeroItems(HOME_HERO_PHOTO_OF_WEEK_ITEMS, ts);
  const teasers = filterActiveHeroItems(HOME_HERO_EVENT_TEASER_ITEMS, ts);
  const events = filterActiveHeroItems(HOME_HERO_CURATED_EVENT_ITEMS, ts);
  const premium = filterActiveHeroItems(HOME_HERO_PREMIUM_PLACEMENT_ITEMS, ts);

  const playlist: HomeHeroItem[] = [];

  if (photoOfWeek[0]) playlist.push(photoOfWeek[0]);
  if (spotlight[0]) playlist.push(spotlight[0]);

  let teaserCursor = 0;
  culture.forEach((slide, index) => {
    playlist.push(slide);

    if (teasers.length > 0 && (index + 1) % EVENT_TEASER_INTERVAL === 0) {
      playlist.push(teasers[teaserCursor % teasers.length]);
      teaserCursor += 1;
    }
  });

  if (events.length > 0) {
    playlist.push(events[0]);
  }

  if (premium.length > 0) {
    playlist.push(...premium);
  }

  const filtered = playlist.filter(
    (item) =>
      Boolean(item.image?.trim()) &&
      item.image.startsWith("https://") &&
      item.title.trim().length > 0
  );

  return filtered.length > 0 ? filtered : [HOME_HERO_FALLBACK_SLIDE];
};

/** @deprecated Use getActiveHomeHeroSlides */
export const getActiveHomeHeroItems = getActiveHomeHeroSlides;

/** @deprecated Use getActiveHomeHeroSlides */
export const getActiveCultureHeroItems = getActiveHomeHeroSlides;

export type HomeHeroNavigationTarget = {
  pathname: string;
  params?: Record<string, string>;
};

const DEFAULT_ROUTE_BY_CHANNEL: Record<HomeHeroChannel, string> = {
  editorial_culture: "/(tabs)/explore",
  community_spotlight: "/(tabs)/explore",
  photo_of_week: "/(tabs)/explore",
  event_teaser: "/(tabs)/map",
  curated_event: "/(tabs)/map",
  premium_placement: "/(tabs)/explore",
};

export const getHomeHeroNavigationTarget = (
  item: HomeHeroItem
): HomeHeroNavigationTarget => {
  const pathname =
    item.targetRoute ?? DEFAULT_ROUTE_BY_CHANNEL[item.channel];

  if (item.targetId && pathname.includes("[id]")) {
    return { pathname, params: { id: item.targetId } };
  }

  if (item.targetId && pathname === "/profile/v2") {
    return { pathname, params: { id: item.targetId } };
  }

  if (item.targetId && pathname === "/event/[id]") {
    return { pathname, params: { id: item.targetId } };
  }

  return { pathname };
};

/** Future admin hook — must return only approved editorial/premium items, never listings */
export const loadHomeHeroItems = async (): Promise<HomeHeroItem[]> => {
  return getActiveHomeHeroSlides();
};

export const normalizeHomeHeroItems = (raw: unknown): HomeHeroItem[] => {
  if (!Array.isArray(raw)) return [];

  const types = new Set<HomeHeroType>([
    "event",
    "business",
    "spotlight",
    "photo",
  ]);
  const channels = new Set<HomeHeroChannel>([
    "editorial_culture",
    "community_spotlight",
    "photo_of_week",
    "event_teaser",
    "curated_event",
    "premium_placement",
  ]);

  return raw
    .map((entry: unknown) => {
      const row = entry as Record<string, unknown>;
      const id = String(row.id || "").trim();
      const typeRaw = String(row.type || "photo").toLowerCase();
      const type = types.has(typeRaw as HomeHeroType)
        ? (typeRaw as HomeHeroType)
        : "photo";

      const channelRaw = String(
        row.channel || row.tier || "editorial_culture"
      ).toLowerCase();
      const channel = channels.has(channelRaw as HomeHeroChannel)
        ? (channelRaw as HomeHeroChannel)
        : "editorial_culture";

      const title = String(row.title || "").trim();
      const subtitle = String(row.subtitle || "").trim();
      const image = String(row.image || row.image_url || "").trim();
      const ctaLabel = String(row.ctaLabel || row.cta_label || "Learn more").trim();

      if (!id || !title || !image) return null;

      const item: HomeHeroItem = {
        id,
        channel,
        type,
        title,
        subtitle,
        image,
        ctaLabel,
        targetRoute: row.targetRoute
          ? String(row.targetRoute)
          : row.target_route
            ? String(row.target_route)
            : undefined,
        targetId: row.targetId
          ? String(row.targetId)
          : row.target_id
            ? String(row.target_id)
            : undefined,
        startsAt: row.startsAt
          ? String(row.startsAt)
          : row.starts_at
            ? String(row.starts_at)
            : undefined,
        endsAt: row.endsAt
          ? String(row.endsAt)
          : row.ends_at
            ? String(row.ends_at)
            : undefined,
        isActive: row.isActive !== false && row.is_active !== false,
        heroApproved:
          row.heroApproved === true ||
          row.hero_approved === true ||
          undefined,
      };

      if (item.isActive && !isEligibleForHomeHero(item)) return null;

      return item;
    })
    .filter(Boolean) as HomeHeroItem[];
};
