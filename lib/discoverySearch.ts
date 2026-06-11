/**
 * Cross-language discovery search — English, Persian (Farsi), and Finglish.
 * Used by Explore, Map, and listing filters.
 */

export type CategorySearchProfile = {
  /** Business category labels saved on listings (case-insensitive). */
  categoryLabels: string[];
  /** Explore / Map filter bucket key, when applicable. */
  filterKey?: string;
  persian: string[];
  finglish: string[];
  english: string[];
};

const PERSIAN_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const PERSIAN_TO_LATIN: Record<string, string> = {
  آ: "a",
  ا: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  ك: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ة: "h",
  ی: "i",
  ي: "i",
  ئ: "y",
  ء: "",
  ـ: "",
};

export const CATEGORY_SEARCH_PROFILES: CategorySearchProfile[] = [
  {
    categoryLabels: ["Pet", "Dog Sitter", "Pet Care", "Pet Services"],
    filterKey: "Services",
    persian: ["سگ", "حیوان", "حیوانات"],
    finglish: ["sag", "sg", "heyvan", "dog", "dogs", "pet", "pets", "sitter"],
    english: ["dog", "dogs", "pet", "pets", "dog sitter", "sitter"],
  },
  {
    categoryLabels: ["Auto", "Auto Repair", "Automotive"],
    filterKey: "Auto Repair",
    persian: ["ماشین", "خودرو", "مکانیک", "تعمیرگاه"],
    finglish: [
      "mashin",
      "khodro",
      "mekanik",
      "tamirgah",
      "otomobil",
      "automobile",
    ],
    english: [
      "auto",
      "car",
      "cars",
      "mechanic",
      "repair",
      "body shop",
      "automotive",
      "garage",
      "dealer",
      "dealership",
    ],
  },
  {
    categoryLabels: ["Food", "Restaurant", "Persian Food", "Iranian Food"],
    filterKey: "Restaurant",
    persian: ["غذا", "رستوران", "غذای ایرانی"],
    finglish: ["ghaza", "restoran", "restaurant"],
    english: [
      "food",
      "restaurant",
      "restaurants",
      "persian food",
      "iranian food",
      "dining",
      "kabob",
      "kebab",
      "catering",
      "homemade food",
      "home food",
    ],
  },
  {
    categoryLabels: ["Home Catering", "Catering", "Home Food", "Home Chef"],
    filterKey: "Restaurant",
    persian: ["غذای خانگی", "کیترینگ", "کترینگ", "آشپزی خانگی", "غذای مهمانی"],
    finglish: [
      "ghazaye khanegi",
      "catering",
      "katering",
      "ashpazi khanegi",
      "home catering",
      "homemade food",
    ],
    english: [
      "catering",
      "home catering",
      "homemade food",
      "homemade",
      "home chef",
      "private chef",
      "home food",
    ],
  },
  {
    categoryLabels: ["Cafe", "Coffee"],
    filterKey: "Cafe",
    persian: ["کافه", "قهوه"],
    finglish: ["cafe", "coffee"],
    english: ["cafe", "coffee"],
  },
  {
    categoryLabels: ["Bakery", "Sweets", "Pastry", "Dessert"],
    filterKey: "Cafe",
    persian: ["شیرینی", "شیرینی خانگی", "کیک", "دسر"],
    finglish: ["shirini", "shirini khanegi", "cake", "deser", "dessert"],
    english: ["bakery", "cake", "cakes", "pastry", "sweets", "dessert"],
  },
  {
    categoryLabels: ["Beauty", "Salon", "Spa", "Hair", "Nails"],
    filterKey: "Beauty",
    persian: ["زیبایی", "آرایشگاه", "مو", "ناخن", "ابرو"],
    finglish: ["zibayi", "arayeshgah", "moo", "nakhon", "abroo"],
    english: [
      "beauty",
      "salon",
      "hair",
      "makeup",
      "nails",
      "eyebrow",
      "spa",
    ],
  },
  {
    categoryLabels: ["Real Estate", "Realtor"],
    filterKey: "Real Estate",
    persian: ["املاک", "مشاور املاک", "خانه", "ملک"],
    finglish: ["amlak", "moshaver amlak", "khaneh", "melk"],
    english: ["realtor", "real estate", "agent", "home", "house", "property"],
  },
  {
    categoryLabels: ["Lawyers", "Legal", "Attorney", "Immigration"],
    filterKey: "Services",
    persian: ["وکیل", "حقوقی", "مهاجرت"],
    finglish: ["vakil", "hoghoghi", "mohajerat", "lawyer"],
    english: ["lawyer", "attorney", "legal", "immigration lawyer", "immigration"],
  },
  {
    categoryLabels: [
      "Doctors",
      "Health & Wellness",
      "Medical",
      "Clinic",
      "Dentist",
    ],
    filterKey: "Services",
    persian: ["دکتر", "پزشک", "دندانپزشک", "کلینیک"],
    finglish: ["doctor", "pezeshk", "dandaanpezeshk", "clinic", "doktor"],
    english: ["doctor", "dentist", "medical", "clinic", "health", "physician"],
  },
  {
    categoryLabels: ["Insurance"],
    filterKey: "Services",
    persian: ["بیمه"],
    finglish: ["bimeh", "bime"],
    english: ["insurance", "insurer", "coverage"],
  },
  {
    categoryLabels: ["Mortgage"],
    filterKey: "Services",
    persian: ["وام مسکن", "وام"],
    finglish: ["vam", "mortgage"],
    english: ["mortgage", "home loan", "lending"],
  },
  {
    categoryLabels: ["Accounting"],
    filterKey: "Services",
    persian: ["حسابداری"],
    finglish: ["hesabdari", "accounting"],
    english: ["accounting", "accountant", "bookkeeping"],
  },
  {
    categoryLabels: ["Tutors", "Education", "Tutoring"],
    filterKey: "Services",
    persian: ["معلم", "تدریس", "آموزش"],
    finglish: ["moallem", "tutor", "amoozesh"],
    english: ["tutor", "tutors", "tutoring", "education", "teaching"],
  },
  {
    categoryLabels: ["Tax Services", "Tax"],
    filterKey: "Services",
    persian: ["مالیات"],
    finglish: ["maliyat", "tax"],
    english: ["tax", "taxes", "tax service", "tax services", "cpa"],
  },
  {
    categoryLabels: [
      "Home Services",
      "Professional Services",
      "Services",
      "Construction",
    ],
    filterKey: "Services",
    persian: ["خدمات", "تعمیرات"],
    finglish: ["khadamat", "tamirat"],
    english: [
      "services",
      "home service",
      "professional",
      "construction",
      "handyman",
    ],
  },
  {
    categoryLabels: ["Events", "Festival", "Concert", "Party", "Workshop"],
    filterKey: "Events",
    persian: ["ایونت", "جشن", "فستیوال", "کنسرت", "ورکشاپ", "رویداد"],
    finglish: ["event", "jashn", "festival", "concert", "workshop"],
    english: [
      "event",
      "events",
      "festival",
      "party",
      "concert",
      "workshop",
      "nowruz",
      "yalda",
    ],
  },
];

/** Shared category filter keys for Map-style search intent (Explore + Map). */
export const DISCOVERY_CATEGORY_FILTERS = [
  { key: "All", label: "All" },
  { key: "Restaurant", label: "Restaurant" },
  { key: "Cafe", label: "Cafe" },
  { key: "Auto Repair", label: "Auto" },
  { key: "Beauty", label: "Beauty" },
  { key: "Real Estate", label: "Real Estate" },
  { key: "Events", label: "Events" },
  { key: "Services", label: "Services" },
] as const;

export const CREATE_BUSINESS_CATEGORIES = [
  "Food",
  "Beauty",
  "Auto",
  "Home Services",
  "Real Estate",
  "Lawyers",
  "Doctors",
  "Insurance",
  "Mortgage",
  "Home Catering",
  "Accounting",
  "Immigration",
  "Tutors",
  "Tax Services",
  "Events",
  "Professional Services",
  "Health & Wellness",
  "Education",
  "Retail",
  "Other",
] as const;

const normalizeLabel = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const transliteratePersian = (text: string) => {
  let output = "";
  for (const char of text) {
    if (PERSIAN_DIGITS[char]) {
      output += PERSIAN_DIGITS[char];
      continue;
    }
    output += PERSIAN_TO_LATIN[char] ?? char;
  }
  return output;
};

/** Fold text for cross-script matching (Persian → Finglish, lowercase). */
export const foldDiscoveryText = (text: string) =>
  transliteratePersian(String(text || ""))
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const profileTerms = (profile: CategorySearchProfile) => [
  ...profile.categoryLabels,
  ...profile.persian,
  ...profile.finglish,
  ...profile.english,
];

const findProfilesForCategory = (category: string) => {
  const normalized = normalizeLabel(category);
  return CATEGORY_SEARCH_PROFILES.filter((profile) =>
    profile.categoryLabels.some((label) => normalizeLabel(label) === normalized)
  );
};

const termsMatchFolded = (foldedTerm: string, foldedToken: string) => {
  if (!foldedTerm || !foldedToken) return false;
  if (foldedTerm === foldedToken) return true;

  const minLen = Math.min(foldedTerm.length, foldedToken.length);
  if (minLen >= 2) {
    if (foldedToken.length >= 2 && foldedTerm.includes(foldedToken)) return true;
    if (foldedTerm.length >= 2 && foldedToken.includes(foldedTerm)) return true;
  }

  if (foldedToken.length >= 3 && foldedTerm.includes(foldedToken)) return true;
  if (foldedTerm.length >= 3 && foldedToken.includes(foldedTerm)) return true;

  return false;
};

const findProfilesForFoldedToken = (foldedToken: string) =>
  CATEGORY_SEARCH_PROFILES.filter((profile) =>
    profileTerms(profile).some((term) =>
      termsMatchFolded(foldDiscoveryText(term), foldedToken)
    )
  );

const WEAK_INFERENCE_TERMS = new Set([
  "service",
  "services",
  "professional",
  "home",
  "business",
  "local",
  "other",
]);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Clear content match — avoids weak single-word inference from generic terms. */
const isStrongContentTermMatch = (term: string, foldedHaystack: string) => {
  const folded = foldDiscoveryText(term);
  if (!folded || folded.length < 2) return false;
  if (WEAK_INFERENCE_TERMS.has(folded)) return false;

  if (/[\u0600-\u06ff]/.test(term) || folded.includes(" ") || folded.length >= 5) {
    return foldedHaystack.includes(folded);
  }

  const pattern = new RegExp(
    `(?:^|\\s)${escapeRegExp(folded)}(?:\\s|$)`,
    "i"
  );
  return pattern.test(foldedHaystack);
};

/** Primary category label match (exact saved category only). */
const profileMatchesPrimaryCategory = (
  profile: CategorySearchProfile,
  category: string
) => {
  const normalizedCategory = normalizeLabel(category);
  return profile.categoryLabels.some(
    (label) => normalizeLabel(label) === normalizedCategory
  );
};

/**
 * Infer secondary discovery intent from listing content.
 * Does not overwrite owner-selected category — used for search + chip matching only.
 */
export const profileStronglyMatchesListing = (
  profile: CategorySearchProfile,
  haystack: string,
  category: string
) => {
  if (profileMatchesPrimaryCategory(profile, category)) return true;

  const foldedHaystack = foldDiscoveryText(haystack);
  return profileTerms(profile).some((term) =>
    isStrongContentTermMatch(term, foldedHaystack)
  );
};

const profileMatchesListing = (
  profile: CategorySearchProfile,
  haystack: string,
  category: string
) => profileStronglyMatchesListing(profile, haystack, category);

/** Human-readable inferred tags (secondary discovery only). */
export const getInferredDiscoveryTags = (
  haystack: string,
  category: string
): string[] => {
  const tags = new Set<string>();

  CATEGORY_SEARCH_PROFILES.forEach((profile) => {
    if (!profileStronglyMatchesListing(profile, haystack, category)) return;

    if (profile.filterKey === "Restaurant") {
      tags.add("Food");
      return;
    }
    if (profile.filterKey === "Auto Repair") {
      tags.add("Auto");
      return;
    }
    if (
      profile.categoryLabels.some((label) =>
        ["Lawyers", "Legal", "Attorney", "Immigration"].includes(label)
      )
    ) {
      tags.add("Legal");
      return;
    }
    if (profile.filterKey === "Cafe") {
      tags.add("Cafe");
      return;
    }
    if (profile.filterKey === "Beauty") {
      tags.add("Beauty");
      return;
    }
    if (profile.filterKey === "Real Estate") {
      tags.add("Real Estate");
      return;
    }
    if (profile.filterKey === "Events") {
      tags.add("Events");
      return;
    }
    if (
      profile.categoryLabels.some((label) =>
        ["Doctors", "Health & Wellness", "Medical", "Clinic", "Dentist"].includes(
          label
        )
      )
    ) {
      tags.add("Health");
    }
  });

  return [...tags];
};

/** Explore / Map filter keys inferred from content (chip matching). */
export const getInferredDiscoveryFilterKeys = (
  haystack: string,
  category: string
): string[] => {
  const keys = new Set<string>();

  CATEGORY_SEARCH_PROFILES.forEach((profile) => {
    if (!profile.filterKey) return;
    if (!profileStronglyMatchesListing(profile, haystack, category)) return;
    keys.add(profile.filterKey);
  });

  return [...keys];
};

/** Searchable blob from inferred discovery tags (Persian / Finglish / English). */
export const getDiscoveryTagsSearchBlob = (
  haystack: string,
  category: string
) => {
  const terms = new Set<string>();

  CATEGORY_SEARCH_PROFILES.forEach((profile) => {
    if (!profileStronglyMatchesListing(profile, haystack, category)) return;

    profileTerms(profile).forEach((term) => {
      const raw = String(term).trim();
      if (!raw) return;
      terms.add(raw);
      terms.add(foldDiscoveryText(raw));
    });
  });

  getInferredDiscoveryTags(haystack, category).forEach((tag) => {
    terms.add(tag);
    terms.add(foldDiscoveryText(tag));
  });

  return [...terms].join(" ");
};

/** Inject synonym blob when listing text/category matches a search profile intent. */
export const getIntentSearchTerms = (haystack: string, category: string) => {
  return getDiscoveryTagsSearchBlob(haystack, category);
};

/** All searchable category aliases for a saved business category label. */
export const getCategorySearchTerms = (category: string) => {
  const matchedProfiles = findProfilesForCategory(category);
  const profiles =
    matchedProfiles.length > 0
      ? matchedProfiles
      : CATEGORY_SEARCH_PROFILES.filter((profile) =>
          profileTerms(profile).some((term) =>
            normalizeLabel(category).includes(normalizeLabel(term))
          )
        );

  const terms = new Set<string>();
  profiles.forEach((profile) => {
    profileTerms(profile).forEach((term) => {
      const raw = String(term).trim();
      if (raw) {
        terms.add(raw);
        terms.add(foldDiscoveryText(raw));
      }
    });
  });

  if (category.trim()) {
    terms.add(category.trim());
    terms.add(foldDiscoveryText(category));
  }

  return [...terms].join(" ");
};

export const expandDiscoveryToken = (token: string) => {
  const trimmed = String(token || "").trim();
  if (!trimmed) return [];

  const folded = foldDiscoveryText(trimmed);
  const terms = new Set<string>([trimmed, folded]);

  findProfilesForFoldedToken(folded).forEach((profile) => {
    profileTerms(profile).forEach((term) => {
      terms.add(term);
      terms.add(foldDiscoveryText(term));
    });
  });

  return [...terms].filter(Boolean);
};

const tokenMatchesFoldedHaystack = (token: string, foldedHaystack: string) => {
  const equivalents = expandDiscoveryToken(token);
  return equivalents.some((candidate) => {
    const foldedCandidate = foldDiscoveryText(candidate);
    if (!foldedCandidate) return false;
    if (foldedHaystack.includes(foldedCandidate)) return true;
    if (foldedCandidate.length < 2) return false;

    return foldedHaystack
      .split(/\s+/)
      .some(
        (word) =>
          word.length >= 2 &&
          (word.includes(foldedCandidate) || foldedCandidate.includes(word))
      );
  });
};

export const discoveryQueryMatchesHaystack = (
  query: string,
  haystack: string
) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const foldedHaystack = foldDiscoveryText(haystack);
  if (tokenMatchesFoldedHaystack(trimmed, foldedHaystack)) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return false;

  return tokens.every((token) =>
    tokenMatchesFoldedHaystack(token, foldedHaystack)
  );
};

export const findDiscoveryFilterKey = (
  query: string,
  filters: { key: string; label: string }[]
) => {
  const foldedQuery = foldDiscoveryText(query);
  if (!foldedQuery) return null;

  const direct = filters.find(
    (filter) =>
      filter.key !== "All" &&
      (foldDiscoveryText(filter.key) === foldedQuery ||
        foldDiscoveryText(filter.label) === foldedQuery)
  );
  if (direct) return direct.key;

  for (const profile of CATEGORY_SEARCH_PROFILES) {
    if (!profile.filterKey) continue;
    const matchesProfile = profileTerms(profile).some((term) =>
      termsMatchFolded(foldDiscoveryText(term), foldedQuery)
    );
    if (matchesProfile) return profile.filterKey;
  }

  return null;
};

export const categoryLabelMatchesProfessionalServices = (category: string) => {
  const normalized = normalizeLabel(category);
  return [
    "lawyers",
    "lawyer",
    "legal",
    "attorney",
    "doctors",
    "doctor",
    "medical",
    "insurance",
    "mortgage",
    "accounting",
    "immigration",
    "tutors",
    "tutor",
    "tax services",
    "tax",
    "professional services",
    "home services",
    "health & wellness",
    "education",
  ].some((label) => normalized === label || normalized.includes(label));
};
