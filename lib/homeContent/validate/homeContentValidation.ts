import type { HomeContentManifest } from "../types/homeContentManifest.types";
import type {
  HomeLibraryImage,
  HomeLibraryPromotion,
} from "../types/homeImageLibrary.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isIsoDateString = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
};

const isSemver = (value: string): boolean =>
  /^\d+\.\d+\.\d+$/.test(value.trim());

export const isHomeImageVariant = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.url) &&
    typeof value.width === "number" &&
    value.width > 0 &&
    typeof value.height === "number" &&
    value.height > 0
  );
};

export const isHomeImageVariants = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return isHomeImageVariant(value.mobile);
};

export const isHomeLibraryImage = (value: unknown): value is HomeLibraryImage => {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.collectionSlug) &&
    Array.isArray(value.tags) &&
    isNonEmptyString(value.description) &&
    isRecord(value.source) &&
    isNonEmptyString(value.source.type) &&
    isNonEmptyString(value.source.name) &&
    isNonEmptyString(value.aspectRatio) &&
    isHomeImageVariants(value.variants) &&
    typeof value.active === "boolean" &&
    typeof value.featured === "boolean" &&
    typeof value.priority === "number" &&
    typeof value.displayOrder === "number" &&
    isRecord(value.artDirection)
  );
};

export const isHomeLibraryPromotion = (
  value: unknown
): value is HomeLibraryPromotion => {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.type) &&
    isNonEmptyString(value.title) &&
    isHomeImageVariants(value.backgroundImage) &&
    typeof value.priority === "number" &&
    typeof value.active === "boolean"
  );
};

export const isHomeContentManifest = (
  value: unknown
): value is HomeContentManifest => {
  if (!isRecord(value)) return false;

  if (
    !isNonEmptyString(value.version) ||
    !isSemver(value.version) ||
    !isIsoDateString(value.generatedAt) ||
    !isNonEmptyString(value.environment) ||
    !isNonEmptyString(value.etag) ||
    !Array.isArray(value.collections) ||
    !isRecord(value.hero) ||
    !Array.isArray(value.hero.playlist) ||
    !isNonEmptyString(value.hero.fallbackImageId) ||
    !isRecord(value.images) ||
    !isRecord(value.artDirection)
  ) {
    return false;
  }

  if (value.promotion !== null && !isHomeLibraryPromotion(value.promotion)) {
    return false;
  }

  for (const image of Object.values(value.images)) {
    if (!isHomeLibraryImage(image)) return false;
  }

  return true;
};

export class HomeContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeContentValidationError";
  }
}

export const assertHomeContentManifest = (
  value: unknown
): HomeContentManifest => {
  if (!isHomeContentManifest(value)) {
    throw new HomeContentValidationError("Invalid home content manifest shape.");
  }
  return value;
};

export const parseHomeContentManifest = (
  raw: string
): HomeContentManifest => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HomeContentValidationError("Manifest is not valid JSON.");
  }
  return assertHomeContentManifest(parsed);
};
