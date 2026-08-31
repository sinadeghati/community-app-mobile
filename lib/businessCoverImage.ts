import { API_BASE_URL } from "./apiConfig";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const isLocalDeviceImageUri = (uri: unknown): boolean => {
  const value = String(uri || "").trim();
  return value.startsWith("file:") || value.startsWith("content:");
};

export const resolveBusinessCoverImageUrl = (uri: unknown): string => {
  const value = String(uri || "").trim();
  if (!value) return "";
  if (isLocalDeviceImageUri(value)) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

export const extractListingCoverImageUrl = (
  listing: Record<string, unknown> | null | undefined
): string | null => {
  if (!listing) return null;

  const direct = [listing.cover_image, listing.image_url, listing.image]
    .map((value) => String(value || "").trim())
    .find(Boolean);

  if (direct) {
    return resolveBusinessCoverImageUrl(direct);
  }

  return null;
};

const parseTimestampMs = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

export const withCoverImageCacheBust = (
  uri: string,
  version: string | number | undefined
): string => {
  const base = String(uri || "").trim();
  if (!base || isLocalDeviceImageUri(base)) return base;

  const stamp = String(version ?? "").trim();
  if (!stamp) return base;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${encodeURIComponent(stamp)}`;
};

export const stampBusinessCoverImageFields = (
  record: Record<string, unknown>,
  coverUri: string,
  options?: { cacheVersion?: string | number; touchUpdatedAt?: boolean }
): Record<string, unknown> => {
  const uri = String(coverUri || "").trim();
  const cacheVersion =
    options?.cacheVersion ?? record.cover_image_updated_at ?? Date.now();

  return {
    ...record,
    cover_image: uri,
    image: uri,
    image_url: uri,
    cover_image_updated_at: String(cacheVersion),
    ...(options?.touchUpdatedAt !== false
      ? { updated_at: new Date().toISOString() }
      : {}),
  };
};

export const shouldPreferLocalCoverImage = (
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): boolean => {
  const localCover = String(
    local.cover_image || local.image_url || local.image || ""
  ).trim();
  if (!localCover) return false;
  if (isLocalDeviceImageUri(localCover)) return true;

  const localMs =
    parseTimestampMs(local.cover_image_updated_at) ??
    parseTimestampMs(local.updated_at);
  const remoteMs = parseTimestampMs(remote.updated_at);

  if (localMs != null && remoteMs != null) {
    return localMs >= remoteMs;
  }
  if (localMs != null && remoteMs == null) return true;
  return false;
};

/** Keep server fields from `remote` while preserving fresher local cover image data. */
export const mergeOwnedBusinessCoverImage = (
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Record<string, unknown> => {
  const merged = { ...remote, ...local };
  const localCover = String(
    local.cover_image || local.image_url || local.image || ""
  ).trim();
  const remoteCover = String(
    remote.cover_image || remote.image_url || remote.image || ""
  ).trim();

  if (shouldPreferLocalCoverImage(local, remote) && localCover) {
    return stampBusinessCoverImageFields(
      merged,
      resolveBusinessCoverImageUrl(localCover),
      {
      cacheVersion:
        (local.cover_image_updated_at as string | number | undefined) ??
        (local.updated_at as string | number | undefined),
      touchUpdatedAt: false,
    });
  }

  if (remoteCover) {
    return stampBusinessCoverImageFields(
      merged,
      resolveBusinessCoverImageUrl(remoteCover),
      {
      cacheVersion:
        (remote.updated_at as string | number | undefined) ??
        (remote.cover_image_updated_at as string | number | undefined),
      touchUpdatedAt: false,
    });
  }

  return merged;
};

export const applyUploadedCoverImageToBusiness = (
  record: Record<string, unknown>,
  coverUrl: string
): Record<string, unknown> =>
  stampBusinessCoverImageFields(record, coverUrl, {
    cacheVersion: Date.now(),
  });

export const normalizeBusinessCoverForDisplay = (
  record: Record<string, unknown>
): Record<string, unknown> => {
  const coverUrl = resolveBusinessCoverImageUrl(
    record.cover_image || record.image_url || record.image || ""
  );
  if (!coverUrl) return record;

  return stampBusinessCoverImageFields(record, coverUrl, {
    cacheVersion:
      (record.cover_image_updated_at as string | number | undefined) ??
      (record.updated_at as string | number | undefined),
    touchUpdatedAt: false,
  });
};
