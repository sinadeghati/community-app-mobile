import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  HOME_CONTENT_MANIFEST_CACHE_KEY_PREFIX,
  getHomeContentEnvironment,
} from "../constants/homeContentCdn";
import {
  HOME_CONTENT_MANIFEST_DEFAULT_TTL_MS,
  HOME_CONTENT_SNAPSHOT_MEMORY_TTL_MS,
} from "../constants/homeContentDefaults";
import type { HomeContentManifest } from "../types/homeContentManifest.types";
import type { HomeContentSnapshot } from "../types/homeContentManifest.types";

type CachedManifestRecord = {
  etag: string;
  fetchedAt: number;
  manifest: HomeContentManifest;
};

type CachedSnapshotRecord = {
  etag: string;
  cachedAt: number;
  snapshot: HomeContentSnapshot;
};

const manifestStorageKey = (): string =>
  `${HOME_CONTENT_MANIFEST_CACHE_KEY_PREFIX}_${getHomeContentEnvironment()}`;

let memoryManifest: CachedManifestRecord | null = null;
let memorySnapshot: CachedSnapshotRecord | null = null;

const isFresh = (fetchedAt: number, ttlMs: number): boolean =>
  Date.now() - fetchedAt < ttlMs;

export const getCachedManifest = async (): Promise<CachedManifestRecord | null> => {
  if (
    memoryManifest &&
    isFresh(memoryManifest.fetchedAt, HOME_CONTENT_MANIFEST_DEFAULT_TTL_MS)
  ) {
    return memoryManifest;
  }

  try {
    const raw = await AsyncStorage.getItem(manifestStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedManifestRecord;
    if (!parsed?.manifest || !parsed.etag) return null;
    if (!isFresh(parsed.fetchedAt, HOME_CONTENT_MANIFEST_DEFAULT_TTL_MS)) {
      return null;
    }
    memoryManifest = parsed;
    return parsed;
  } catch {
    return null;
  }
};

export const setCachedManifest = async (
  manifest: HomeContentManifest,
  etag: string
): Promise<void> => {
  const record: CachedManifestRecord = {
    etag,
    fetchedAt: Date.now(),
    manifest,
  };
  memoryManifest = record;
  await AsyncStorage.setItem(manifestStorageKey(), JSON.stringify(record));
};

export const getCachedSnapshot = (): HomeContentSnapshot | null => {
  if (
    memorySnapshot &&
    isFresh(memorySnapshot.cachedAt, HOME_CONTENT_SNAPSHOT_MEMORY_TTL_MS)
  ) {
    return memorySnapshot.snapshot;
  }
  return null;
};

export const setCachedSnapshot = (
  snapshot: HomeContentSnapshot,
  etag: string
): void => {
  memorySnapshot = {
    etag,
    cachedAt: Date.now(),
    snapshot,
  };
};

export const clearHomeContentCache = async (): Promise<void> => {
  memoryManifest = null;
  memorySnapshot = null;
  await AsyncStorage.removeItem(manifestStorageKey());
};

export const getCachedManifestEtag = async (): Promise<string | null> => {
  const cached = await getCachedManifest();
  return cached?.etag ?? null;
};
