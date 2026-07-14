import type { HomeCollection, HomeCollectionSlug } from "../types/homeImageLibrary.types";

export type HomeCollectionCatalogEntry = HomeCollection & {
  /** Target image count for initial library seed (~200 total). */
  targetImageCount: number;
};

/** Initial taxonomy — metadata only; assets uploaded via admin later. */
export const HOME_COLLECTION_CATALOG: HomeCollectionCatalogEntry[] = [
  {
    id: "col_tehran",
    slug: "tehran",
    title: "Tehran",
    description: "Capital skyline, Milad Tower, urban Persian life.",
    defaultRotationWeight: 10,
    displayOrder: 10,
    active: true,
    targetImageCount: 12,
  },
  {
    id: "col_isfahan",
    slug: "isfahan",
    title: "Isfahan",
    description: "Naqsh-e Jahan, bridges, Safavid architecture.",
    defaultRotationWeight: 10,
    displayOrder: 20,
    active: true,
    targetImageCount: 12,
  },
  {
    id: "col_shiraz",
    slug: "shiraz",
    title: "Shiraz",
    description: "Poetry, gardens, Hafez, pink sunsets.",
    defaultRotationWeight: 9,
    displayOrder: 30,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_yazd",
    slug: "yazd",
    title: "Yazd",
    description: "Windcatchers, desert city, UNESCO old town.",
    defaultRotationWeight: 9,
    displayOrder: 40,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_persepolis",
    slug: "persepolis",
    title: "Persepolis",
    description: "Achaemenid ruins, ceremonial grandeur.",
    defaultRotationWeight: 9,
    displayOrder: 50,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_persian_architecture",
    slug: "persian-architecture",
    title: "Persian Architecture",
    defaultRotationWeight: 8,
    displayOrder: 60,
    active: true,
    targetImageCount: 15,
  },
  {
    id: "col_persian_gardens",
    slug: "persian-gardens",
    title: "Persian Gardens",
    defaultRotationWeight: 7,
    displayOrder: 70,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_persian_mountains",
    slug: "persian-mountains",
    title: "Persian Mountains",
    defaultRotationWeight: 7,
    displayOrder: 80,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_persian_desert",
    slug: "persian-desert",
    title: "Persian Desert",
    defaultRotationWeight: 7,
    displayOrder: 90,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_caspian_sea",
    slug: "caspian-sea",
    title: "Caspian Sea",
    defaultRotationWeight: 6,
    displayOrder: 100,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_persian_food",
    slug: "persian-food",
    title: "Persian Food",
    defaultRotationWeight: 8,
    displayOrder: 110,
    active: true,
    targetImageCount: 12,
  },
  {
    id: "col_persian_cafes",
    slug: "persian-cafes",
    title: "Persian Cafes",
    defaultRotationWeight: 6,
    displayOrder: 120,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_luxury_restaurants",
    slug: "luxury-restaurants",
    title: "Luxury Restaurants",
    defaultRotationWeight: 6,
    displayOrder: 130,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_persian_culture",
    slug: "persian-culture",
    title: "Persian Culture",
    defaultRotationWeight: 8,
    displayOrder: 140,
    active: true,
    targetImageCount: 12,
  },
  {
    id: "col_persian_art",
    slug: "persian-art",
    title: "Persian Art",
    defaultRotationWeight: 7,
    displayOrder: 150,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_persian_calligraphy",
    slug: "persian-calligraphy",
    title: "Persian Calligraphy",
    defaultRotationWeight: 6,
    displayOrder: 160,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_festivals",
    slug: "festivals",
    title: "Festivals",
    defaultRotationWeight: 8,
    displayOrder: 170,
    active: true,
    targetImageCount: 10,
  },
  {
    id: "col_concerts",
    slug: "concerts",
    title: "Concerts",
    defaultRotationWeight: 7,
    displayOrder: 180,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_night_life",
    slug: "night-life",
    title: "Night Life",
    defaultRotationWeight: 6,
    displayOrder: 190,
    active: true,
    targetImageCount: 8,
  },
  {
    id: "col_seasonal",
    slug: "seasonal",
    title: "Seasonal",
    defaultRotationWeight: 8,
    displayOrder: 200,
    active: true,
    targetImageCount: 12,
  },
  {
    id: "col_featured",
    slug: "featured",
    title: "Featured",
    description: "Cross-collection highlights; may overlap catalog IDs.",
    defaultRotationWeight: 10,
    displayOrder: 210,
    active: true,
    targetImageCount: 15,
  },
  {
    id: "col_promotions",
    slug: "promotions",
    title: "Promotions",
    description: "Promotion-specific library assets (separate from carousel).",
    defaultRotationWeight: 0,
    displayOrder: 220,
    active: true,
    targetImageCount: 0,
  },
];

export const HOME_COLLECTION_TARGET_TOTAL = HOME_COLLECTION_CATALOG.reduce(
  (sum, entry) => sum + entry.targetImageCount,
  0
);

export const getCollectionBySlug = (
  slug: HomeCollectionSlug
): HomeCollectionCatalogEntry | undefined =>
  HOME_COLLECTION_CATALOG.find((entry) => entry.slug === slug);

export const getDefaultRotationCollectionSlugs = (): HomeCollectionSlug[] =>
  HOME_COLLECTION_CATALOG.filter(
    (entry) => entry.active && entry.defaultRotationWeight > 0
  )
    .sort((a, b) => b.defaultRotationWeight - a.defaultRotationWeight)
    .map((entry) => entry.slug);
