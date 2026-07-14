import {
  getCachedManifest,
  getCachedManifestEtag,
  getCachedSnapshot,
  setCachedSnapshot,
} from "../cache/homeContentCache";
import { prefetchHeroSlidesAround } from "../cache/homeImagePrefetch";
import { fetchHomeContentManifest } from "../cdn/fetchHomeContentManifest";
import { createEmptyHomeContentManifest } from "../seed/emptyManifest";
import { mapManifestToSnapshot } from "../selectors/mapManifestToSnapshot";
import type { HomeContentProvider, HomeContentProviderOptions } from "./HomeContentProvider";
import type { HomeContentManifest } from "../types/homeContentManifest.types";
import type { HomeHeroSlide, HomeContentSnapshot } from "../types/homeContentManifest.types";
import { getHomeContentEnvironment } from "../constants/homeContentCdn";

export type ManifestHomeContentProviderOptions = {
  manifestUrl?: string;
  /** Use bundled empty manifest when CDN is unreachable (dev default). */
  useBundledFallbackOnError?: boolean;
};

const resolveManifest = async (
  forceRefresh: boolean,
  manifestUrl?: string
): Promise<{ manifest: HomeContentManifest; source: HomeContentSnapshot["source"] }> => {
  if (!forceRefresh) {
    const cached = await getCachedManifest();
    if (cached?.manifest) {
      return { manifest: cached.manifest, source: "cache" };
    }
  }

  const etag = forceRefresh ? null : await getCachedManifestEtag();

  try {
    const result = await fetchHomeContentManifest({
      manifestUrl,
      ifNoneMatch: etag,
    });

    if (result.status === "not_modified") {
      const cached = await getCachedManifest();
      if (cached?.manifest) {
        return { manifest: cached.manifest, source: "cache" };
      }
    }

    return { manifest: result.manifest, source: "cdn" };
  } catch {
    const cached = await getCachedManifest();
    if (cached?.manifest) {
      return { manifest: cached.manifest, source: "cache" };
    }

    const bundled = createEmptyHomeContentManifest(getHomeContentEnvironment());
    return { manifest: bundled, source: "bundled" };
  }
};

export class ManifestHomeContentProvider implements HomeContentProvider {
  private readonly manifestUrl?: string;
  private readonly useBundledFallbackOnError: boolean;

  constructor(options: ManifestHomeContentProviderOptions = {}) {
    this.manifestUrl = options.manifestUrl;
    this.useBundledFallbackOnError = options.useBundledFallbackOnError ?? true;
  }

  async getSnapshot(
    options: HomeContentProviderOptions = {}
  ): Promise<HomeContentSnapshot> {
    const forceRefresh = options.forceRefresh === true;

    if (!forceRefresh) {
      const memorySnapshot = getCachedSnapshot();
      if (memorySnapshot) return memorySnapshot;
    }

    const { manifest, source } = await resolveManifest(
      forceRefresh,
      this.manifestUrl
    );

    const snapshot = mapManifestToSnapshot(
      manifest,
      this.useBundledFallbackOnError ? source : "cdn"
    );

    setCachedSnapshot(snapshot, manifest.etag);
    return snapshot;
  }

  async prefetchAround(index: number, slides: HomeHeroSlide[]): Promise<void> {
    await prefetchHeroSlidesAround(slides, index);
  }
}

export const createManifestHomeContentProvider = (
  options?: ManifestHomeContentProviderOptions
): ManifestHomeContentProvider => new ManifestHomeContentProvider(options);
