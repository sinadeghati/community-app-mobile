/** Explore screen premium UI tokens — presentation only. */
export const explorePremium = {
  horizontalPad: 20,
  sectionTop: 28,
  sectionBottom: 14,
  cardGap: 14,
  cardRadius: 20,
  cardRadiusLg: 24,
  pillRadius: 999,
  heroHeight: 204,
  featuredCardWidth: 228,
  featuredImageHeight: 168,
  listImageSize: 92,
  shadow: {
    card: {
      shadowColor: "#0B2B33",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    cardSoft: {
      shadowColor: "#0B2B33",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    hero: {
      shadowColor: "#0B2B33",
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    cta: {
      shadowColor: "#0D9488",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },
} as const;
