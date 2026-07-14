import type { HomeContentProvider } from "./HomeContentProvider";
import { ManifestHomeContentProvider } from "./ManifestHomeContentProvider";
import { ApiHomeContentProvider } from "./ApiHomeContentProvider";

export type HomeContentProviderKind = "manifest" | "api";

export type CreateHomeContentProviderOptions = {
  kind?: HomeContentProviderKind;
  manifestUrl?: string;
  preferApi?: boolean;
};

/**
 * Factory for Home content providers.
 * Default: manifest-first CDN (Phase 1).
 */
export const createHomeContentProvider = (
  options: CreateHomeContentProviderOptions = {}
): HomeContentProvider => {
  const kind = options.kind ?? "manifest";

  if (kind === "api") {
    return new ApiHomeContentProvider({
      preferApi: options.preferApi,
    });
  }

  return new ManifestHomeContentProvider({
    manifestUrl: options.manifestUrl,
  });
};
