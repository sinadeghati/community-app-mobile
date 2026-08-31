import { API_BASE_URL } from "./apiConfig";
import { resolveStoredAccessToken } from "./authSession";
import { API } from "./api";

export type ListingFieldPayload = {
  title: string;
  city: string;
  state: string;
  description: string;
  contact_info: string;
  category: string;
  latitude: number;
  longitude: number;
};

const isLikelyClientGeneratedBusinessId = (id: string) => {
  if (!/^\d+$/.test(id)) {
    return false;
  }
  const numeric = Number(id);
  return Number.isFinite(numeric) && numeric >= 1_000_000_000_000;
};

export const normalizeMyListings = (response: unknown) => {
  if (Array.isArray(response)) {
    return response as Array<Record<string, unknown>>;
  }
  if (response && typeof response === "object") {
    const results = (response as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return results as Array<Record<string, unknown>>;
    }
  }
  return [];
};

export const logListingApiRequest = (
  method: string,
  endpoint: string,
  details: Record<string, unknown>
) => {
  console.log("[listing-api] request", {
    method,
    endpoint: `${API_BASE_URL}${endpoint}`,
    ...details,
  });
};

export const logListingApiResponse = (
  method: string,
  endpoint: string,
  status: number | undefined,
  body: unknown
) => {
  console.log("[listing-api] response", {
    method,
    endpoint: `${API_BASE_URL}${endpoint}`,
    status,
    body,
  });
};

export async function resolveServerListingId(
  businessId: string,
  business?: Record<string, unknown> | null
): Promise<string | null> {
  const stored = business?.server_listing_id ?? business?.listing_id;
  if (stored != null && String(stored).trim()) {
    return String(stored);
  }

  let myListings: Array<Record<string, unknown>> = [];
  try {
    myListings = normalizeMyListings(await API.getMyListings());
  } catch (error) {
    logListingApiResponse("GET", "/my-listing/", undefined, {
      error: String(error),
    });
  }

  const direct = myListings.find((row) => String(row.id || "") === businessId);
  if (direct?.id != null) {
    return String(direct.id);
  }

  if (!isLikelyClientGeneratedBusinessId(businessId)) {
    return businessId;
  }

  const title = String(
    business?.business_name || business?.name || business?.title || ""
  )
    .trim()
    .toLowerCase();
  const phone = String(business?.phone || business?.contact_info || "").replace(
    /\D/g,
    ""
  );

  const matched = myListings.find((row) => {
    const rowTitle = String(row.title || "").trim().toLowerCase();
    const rowPhone = String(row.contact_info || "").replace(/\D/g, "");
    if (title && rowTitle && title === rowTitle) {
      return true;
    }
    if (phone && rowPhone && phone === rowPhone) {
      return true;
    }
    return false;
  });

  return matched?.id != null ? String(matched.id) : null;
}

export async function patchOrCreateMyListing(
  serverListingId: string | null,
  payload: ListingFieldPayload
): Promise<{ id: string; created: boolean }> {
  const hasAuth = Boolean(await resolveStoredAccessToken());

  if (serverListingId) {
    const endpoint = `/my-listing/${serverListingId}/`;
    logListingApiRequest("PATCH", endpoint, {
      businessId: serverListingId,
      auth: hasAuth,
      payloadKeys: Object.keys(payload),
      payload,
    });

    try {
      const updated = await API.updateMyListing(Number(serverListingId), payload);
      logListingApiResponse("PATCH", endpoint, 200, updated);
      return { id: String(updated?.id ?? serverListingId), created: false };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number; data?: unknown } })
        ?.response?.status;
      const body = (error as { response?: { data?: unknown } })?.response?.data;
      logListingApiResponse("PATCH", endpoint, status, body);
      if (status !== 404) {
        throw error;
      }
    }
  }

  const endpoint = "/listings/";
  logListingApiRequest("POST", endpoint, {
    auth: hasAuth,
    payloadKeys: Object.keys(payload),
    payload,
  });

  const created = await API.createListing(payload);
  logListingApiResponse("POST", endpoint, 201, created);

  const id = String(
    (created as { id?: unknown })?.id ??
      (created as { pk?: unknown })?.pk ??
      ""
  );
  if (!id) {
    throw new Error("create_listing_missing_id");
  }

  return { id, created: true };
}

export async function uploadGalleryImagesToListing(
  listingId: string,
  uris: string[]
): Promise<{
  uploaded: number;
  failed: number;
  messages: string[];
}> {
  const localUris = uris.filter(
    (uri) => uri.startsWith("file:") || uri.startsWith("content:")
  );

  let uploaded = 0;
  let failed = 0;
  const messages: string[] = [];

  for (const uri of localUris) {
    const endpoint = `/listings/${listingId}/images/`;
    try {
      logListingApiRequest("POST", endpoint, {
        listingId,
        multipart: true,
        auth: Boolean(await resolveStoredAccessToken()),
        fileUri: uri,
      });
      const result = await API.uploadListingImage(listingId, uri);
      logListingApiResponse("POST", endpoint, 201, result);
      uploaded += 1;
    } catch (error: unknown) {
      failed += 1;
      const status = (error as { response?: { status?: number; data?: unknown } })
        ?.response?.status;
      const body = (error as { response?: { data?: unknown } })?.response?.data;
      logListingApiResponse("POST", endpoint, status, body);
      messages.push(
        status
          ? `Gallery upload failed with status ${status}.`
          : "Gallery upload failed."
      );
    }
  }

  return { uploaded, failed, messages };
}

export type UploadBusinessCoverImageResult =
  | { ok: true; coverUrl: string }
  | { ok: false; message: string };

export async function uploadBusinessCoverImageToListing(
  listingId: string,
  imageUri: string
): Promise<UploadBusinessCoverImageResult> {
  const { extractListingCoverImageUrl } = await import("./businessCoverImage");
  const id = String(listingId || "").trim();
  const uri = String(imageUri || "").trim();

  if (!id || !uri) {
    return { ok: false, message: "Missing listing or image." };
  }

  try {
    await API.uploadListingImage(id, uri);
    const listing = (await API.getListing(id)) as Record<string, unknown>;
    const coverUrl = extractListingCoverImageUrl(listing);

    if (!coverUrl) {
      return {
        ok: false,
        message: "Upload succeeded but cover URL was not returned.",
      };
    }

    return { ok: true, coverUrl };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}
