import type { Ionicons } from "@expo/vector-icons";

export type CategoryChipVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
};

const teal = "#0D9488";

/** Filter keys used by Map / Explore quick chips. */
export const CATEGORY_CHIP_VISUALS: Record<string, CategoryChipVisual> = {
  All: {
    icon: "grid",
    color: teal,
    tint: "rgba(13,148,136,0.14)",
  },
  Restaurant: {
    icon: "restaurant",
    color: "#EA580C",
    tint: "rgba(234,88,12,0.14)",
  },
  Cafe: {
    icon: "cafe",
    color: "#92400E",
    tint: "rgba(146,64,14,0.14)",
  },
  "Auto Repair": {
    icon: "car",
    color: "#2563EB",
    tint: "rgba(37,99,235,0.14)",
  },
  Beauty: {
    icon: "sparkles",
    color: "#DB2777",
    tint: "rgba(219,39,119,0.14)",
  },
  Events: {
    icon: "calendar",
    color: "#7C3AED",
    tint: "rgba(124,58,237,0.14)",
  },
  Services: {
    icon: "briefcase",
    color: "#16A34A",
    tint: "rgba(22,163,74,0.14)",
  },
  "Real Estate": {
    icon: "home",
    color: "#0891B2",
    tint: "rgba(8,145,178,0.14)",
  },
  Legal: {
    icon: "scale",
    color: "#6D28D9",
    tint: "rgba(109,40,217,0.14)",
  },
  Medical: {
    icon: "medkit",
    color: "#2563EB",
    tint: "rgba(37,99,235,0.14)",
  },
  Insurance: {
    icon: "shield-checkmark",
    color: "#059669",
    tint: "rgba(5,150,105,0.14)",
  },
  "Home Catering": {
    icon: "nutrition",
    color: "#F97316",
    tint: "rgba(249,115,22,0.14)",
  },
};

const CATEGORY_VISUAL_ALIASES: Record<string, string> = {
  Food: "Restaurant",
  Auto: "Auto Repair",
  Lawyers: "Legal",
  Doctors: "Medical",
  "Home Services": "Services",
  "Professional Services": "Services",
  "Health & Wellness": "Medical",
  Accounting: "Services",
  Immigration: "Legal",
  Tutors: "Services",
  "Tax Services": "Services",
  Mortgage: "Services",
  Education: "Services",
  Retail: "Services",
  Other: "All",
};

const DEFAULT_CATEGORY_CHIP_VISUAL: CategoryChipVisual = {
  icon: "ellipse",
  color: "#6B7280",
  tint: "rgba(107,114,128,0.12)",
};

export const getCategoryChipVisual = (keyOrLabel: string): CategoryChipVisual => {
  const raw = String(keyOrLabel || "").trim();
  if (!raw) return DEFAULT_CATEGORY_CHIP_VISUAL;

  if (CATEGORY_CHIP_VISUALS[raw]) {
    return CATEGORY_CHIP_VISUALS[raw];
  }

  const aliasKey = CATEGORY_VISUAL_ALIASES[raw];
  if (aliasKey && CATEGORY_CHIP_VISUALS[aliasKey]) {
    return CATEGORY_CHIP_VISUALS[aliasKey];
  }

  const normalized = raw.toLowerCase();
  const byLabel = Object.entries(CATEGORY_CHIP_VISUALS).find(
    ([key]) => key.toLowerCase() === normalized
  );
  if (byLabel) return byLabel[1];

  return DEFAULT_CATEGORY_CHIP_VISUAL;
};
