import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "./api";

export type BusinessGalleryImage = {
  id: string;
  uri: string;
};

const extractUri = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const uri = record.image_url ?? record.image ?? record.url;
  return typeof uri === "string" && uri.trim() ? uri.trim() : null;
};

/**
 * Permanent business gallery only — excludes cover, logo, and update banners.
 */
export const getBusinessGalleryPhotos = (
  business: Record<string, unknown> | null | undefined
): BusinessGalleryImage[] => {
  const result: BusinessGalleryImage[] = [];
  const seen = new Set<string>();

  const push = (uri: string, id: string) => {
    if (seen.has(uri)) return;
    seen.add(uri);
    result.push({ id, uri });
  };

  if (Array.isArray(business?.images)) {
    business.images.forEach((entry, index) => {
      const uri = extractUri(entry);
      if (!uri) return;

      const id =
        entry &&
        typeof entry === "object" &&
        "id" in entry &&
        String((entry as Record<string, unknown>).id || "").trim()
          ? String((entry as Record<string, unknown>).id)
          : `gallery-${index}`;

      push(uri, id);
    });
  }

  if (Array.isArray(business?.gallery)) {
    business.gallery.forEach((entry, index) => {
      const uri = extractUri(entry);
      if (uri) push(uri, `gallery-legacy-${index}`);
    });
  }

  return result;
};

export const getBusinessGalleryUris = (
  business: Record<string, unknown> | null | undefined
): string[] => getBusinessGalleryPhotos(business).map((photo) => photo.uri);

export const sanitizeBusinessGalleryForSave = (
  uris: string[]
): { id: string; image_url: string }[] =>
  uris
    .map((uri) => uri.trim())
    .filter(Boolean)
    .map((uri, index) => ({
      id: `gallery-${index}`,
      image_url: uri,
    }));

export const loadBusinessProfileRecord = async (
  businessId: string
): Promise<Record<string, unknown> | null> => {
  if (!businessId) return null;

  const localRaw = await AsyncStorage.getItem(`profile_v2_${businessId}`);
  if (localRaw) {
    return JSON.parse(localRaw) as Record<string, unknown>;
  }

  try {
    if ((API as { getListing?: (id: string) => Promise<unknown> }).getListing) {
      const apiData = await (
        API as { getListing: (id: string) => Promise<unknown> }
      ).getListing(businessId);
      if (apiData && typeof apiData === "object") {
        return apiData as Record<string, unknown>;
      }
    }

    const response = await API.getListings();
    const list = Array.isArray(response) ? response : response?.results || [];
    const match = list.find(
      (item: Record<string, unknown>) => String(item?.id) === businessId
    );

    return match ?? null;
  } catch (error) {
    console.log("BUSINESS GALLERY LOAD ERROR:", error);
    return null;
  }
};
