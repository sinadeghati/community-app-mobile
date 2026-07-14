import type { HomeContentSnapshot } from "../types/homeContentManifest.types";
import type { HomeHeroSlide } from "../types/homeContentManifest.types";

export type HomeContentProviderOptions = {
  forceRefresh?: boolean;
};

export interface HomeContentProvider {
  getSnapshot(
    options?: HomeContentProviderOptions
  ): Promise<HomeContentSnapshot>;
  prefetchAround(index: number, slides: HomeHeroSlide[]): Promise<void>;
}
