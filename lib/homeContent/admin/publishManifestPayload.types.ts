import type { HomeContentManifest } from "../types/homeContentManifest.types";

/**
 * Payload produced by backend manifest_builder service on publish.
 * Mobile does not send this — documented for Django admin integration.
 */
export type PublishHomeContentManifestPayload = {
  environment: HomeContentManifest["environment"];
  version: string;
  generatedAt: string;
  etag: string;
  manifest: HomeContentManifest;
  cdn: {
    manifestObjectKey: string;
    manifestPublicUrl: string;
    purgePaths: string[];
  };
};

export type ManifestBuildOptions = {
  environment: HomeContentManifest["environment"];
  slimManifest: boolean;
  maxPlaylistItems: number;
  includeInactiveCollections: boolean;
};

export type ManifestBuildResult = {
  payload: PublishHomeContentManifestPayload;
  warnings: string[];
};
