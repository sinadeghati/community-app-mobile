import { apiUrl } from "../../apiConfig";
import type { HomeContentProvider, HomeContentProviderOptions } from "./HomeContentProvider";
import type { HomeContentSnapshot, HomeHeroSlide } from "../types/homeContentManifest.types";
import { ManifestHomeContentProvider } from "./ManifestHomeContentProvider";

/**
 * Phase 2 provider — delegates to manifest CDN until backend API is live.
 *
 * Future endpoints (not implemented on server yet):
 * - GET  /api/home-content/manifest/
 * - HEAD /api/home-content/manifest/
 */
export const HOME_CONTENT_MANIFEST_API_PATH = "/home-content/manifest/";

export const getHomeContentManifestApiUrl = (): string =>
  apiUrl(HOME_CONTENT_MANIFEST_API_PATH);

export type ApiHomeContentProviderOptions = {
  /** When true, uses API redirect URL; otherwise CDN manifest (Phase 1). */
  preferApi?: boolean;
};

export class ApiHomeContentProvider implements HomeContentProvider {
  private readonly manifestProvider: ManifestHomeContentProvider;
  private readonly preferApi: boolean;

  constructor(options: ApiHomeContentProviderOptions = {}) {
    this.preferApi = options.preferApi ?? false;
    this.manifestProvider = new ManifestHomeContentProvider({
      manifestUrl: options.preferApi
        ? getHomeContentManifestApiUrl()
        : undefined,
    });
  }

  async getSnapshot(
    options?: HomeContentProviderOptions
  ): Promise<HomeContentSnapshot> {
    // Phase 2 stub: API route mirrors CDN contract once backend ships.
    return this.manifestProvider.getSnapshot(options);
  }

  async prefetchAround(index: number, slides: HomeHeroSlide[]): Promise<void> {
    await this.manifestProvider.prefetchAround(index, slides);
  }
}

export const createApiHomeContentProvider = (
  options?: ApiHomeContentProviderOptions
): ApiHomeContentProvider => new ApiHomeContentProvider(options);
