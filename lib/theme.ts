import { korookBrand } from "./korookBrand";

export const theme = {
  colors: {
    turquoise: korookBrand.colors.primary,
    deepTeal: korookBrand.colors.navy,
    tealDark: korookBrand.colors.navySoft,
    navy: korookBrand.colors.navy,
    ivory: korookBrand.colors.backgroundWarm,
    card: korookBrand.colors.card,
    softCard: korookBrand.colors.background,
    gold: "#E6C27A",
    burgundy: "#8B1E3F",
    charcoal: korookBrand.colors.text,
    muted: korookBrand.colors.textSecondary,
    border: korookBrand.colors.border,
    success: korookBrand.colors.success,
    danger: korookBrand.colors.danger,
    eventPurple: "#7C3AED",
    primary: korookBrand.colors.primary,
    primaryDark: korookBrand.colors.primaryDark,
  },

  radius: {
    sm: korookBrand.radius.sm,
    md: korookBrand.radius.md,
    lg: korookBrand.radius.lg,
    xl: 30,
    pill: korookBrand.radius.pill,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
  },

  shadow: {
    soft: korookBrand.shadow.card,
    medium: korookBrand.shadow.hero,
  },

  gradients: {
    heroTurquoise: [...korookBrand.gradients.hero],
    darkTeal: [korookBrand.colors.navySoft, korookBrand.colors.navy],
    nowruz: [korookBrand.colors.primary, "#E6C27A"],
    yalda: ["#8B1E3F", "#E6C27A"],
    korookHeader: [...korookBrand.gradients.header],
  },
};
