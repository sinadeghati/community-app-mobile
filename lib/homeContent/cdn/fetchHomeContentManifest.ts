import {
  getHomeContentManifestUrl,
  getHomeContentEnvironment,
} from "../constants/homeContentCdn";
import { parseHomeContentManifest } from "../validate/homeContentValidation";
import type { HomeContentManifestFetchResult } from "../types/homeContentManifest.types";
import {
  getCachedManifest,
  setCachedManifest,
} from "../cache/homeContentCache";

const normalizeEtag = (etag: string | null): string | null => {
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/"/g, "").trim() || null;
};

export type FetchHomeContentManifestOptions = {
  manifestUrl?: string;
  ifNoneMatch?: string | null;
  timeoutMs?: number;
};

/**
 * Fetches manifest JSON from CDN with optional ETag validation.
 * Returns not_modified when server responds 304.
 */
export const fetchHomeContentManifest = async (
  options: FetchHomeContentManifestOptions = {}
): Promise<HomeContentManifestFetchResult> => {
  const manifestUrl = options.manifestUrl ?? getHomeContentManifestUrl();
  const ifNoneMatch = normalizeEtag(options.ifNoneMatch ?? null);
  const timeoutMs = options.timeoutMs ?? 15_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (ifNoneMatch) {
      headers["If-None-Match"] = `"${ifNoneMatch}"`;
    }

    const response = await fetch(manifestUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (response.status === 304) {
      const cached = await getCachedManifest();
      if (!cached) {
        throw new Error("Manifest not modified but no cached copy exists.");
      }
      return {
        status: "not_modified",
        etag: cached.etag,
        fromCache: true,
      };
    }

    if (!response.ok) {
      throw new Error(
        `Home content manifest fetch failed (${response.status}) for ${manifestUrl}`
      );
    }

    const raw = await response.text();
    const manifest = parseHomeContentManifest(raw);
    const responseEtag =
      normalizeEtag(response.headers.get("etag")) ?? manifest.etag;

    const manifestWithEnv = {
      ...manifest,
      environment: manifest.environment ?? getHomeContentEnvironment(),
      etag: responseEtag,
    };

    await setCachedManifest(manifestWithEnv, responseEtag);

    return {
      status: "ok",
      manifest: manifestWithEnv,
      etag: responseEtag,
      fromCache: false,
    };
  } finally {
    clearTimeout(timeout);
  }
};
