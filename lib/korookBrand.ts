/**
 * Korook brand tokens — source of truth for UI styling.
 * Logo artwork: assets/brand/korook/logo-primary.svg (source), korook-logo-primary.png (mobile)
 */

export const korookBrand = {
  name: "Korook",
  tagline: "DISCOVER. CONNECT. GROW.",
  mission:
    "Korook helps you discover amazing Persian-owned businesses, connect with local communities, and grow together.",

  colors: {
    primary: "#18D3C5",
    primaryDark: "#00C2B8",
    primaryLight: "#33DCD0",
    navy: "#0A1F44",
    navyDark: "#071730",
    navySoft: "#152847",
    background: "#F5F7FA",
    backgroundWarm: "#F5F7FA",
    card: "#FFFFFF",
    text: "#0A1F44",
    textSecondary: "#8B95A5",
    textMuted: "#6B7280",
    border: "#E4E8EF",
    success: "#22C55E",
    danger: "#EF4444",
    white: "#FFFFFF",
    overlay: "rgba(10, 31, 68, 0.55)",
  },

  gradients: {
    hero: ["#18D3C5", "#00C2B8", "#0A1F44"] as const,
    splash: ["#FFFFFF", "#F5F7FA"] as const,
    header: ["#18D3C5", "#00C2B8"] as const,
  },

  typography: {
    fontFamily: "System",
    recommendedWebFont: "Montserrat",
    heroTitle: { fontSize: 28, fontWeight: "800" as const },
    sectionTitle: { fontSize: 20, fontWeight: "800" as const },
    body: { fontSize: 15, fontWeight: "500" as const },
    caption: { fontSize: 13, fontWeight: "600" as const },
    label: { fontSize: 12, fontWeight: "800" as const, letterSpacing: 0.6 },
  },

  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },

  shadow: {
    card: {
      shadowColor: "#0A1F44",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    hero: {
      shadowColor: "#0A1F44",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },

  button: {
    primary: {
      backgroundColor: "#18D3C5",
      textColor: "#FFFFFF",
      borderRadius: 18,
      height: 54,
    },
    secondary: {
      backgroundColor: "rgba(24, 211, 197, 0.12)",
      textColor: "#00C2B8",
      borderRadius: 18,
      height: 54,
    },
    ghost: {
      backgroundColor: "#FFFFFF",
      textColor: "#0A1F44",
      borderColor: "#E4E8EF",
      borderRadius: 18,
      height: 54,
    },
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderColor: "#E4E8EF",
    borderWidth: 1,
    padding: 16,
  },

  links: {
    privacyPolicy: "/legal/privacy-policy",
    termsOfService: "/legal/terms-of-service",
    contactUs: "/legal/contact-us",
    supportEmail: "support@korook.com",
    website: "https://korook.com",
  },
} as const;

export const KOROOK_LOGO_PRIMARY = require("../assets/brand/korook/korook-logo-primary.png");
