import { apiUrl } from "./apiConfig";
import {
  isApiTokenInvalidResponse,
  resolveStoredAccessToken,
  tryRefreshStoredAccessToken,
} from "./authSession";
import {
  executeProfileAvatarUpload,
  prepareAvatarUploadFile,
  PROFILE_AVATAR_PATH,
  ProfileAvatarUploadError,
  type AvatarSelection,
} from "./profileAvatar";

export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message);
    this.name = "ProfileApiError";
  }
}

const parseProfileResponse = async (
  res: Response
): Promise<Record<string, unknown>> => {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** Fetch the authenticated account profile from the backend API. */
export async function fetchAccountProfile(
  accessToken?: string
): Promise<Record<string, unknown>> {
  let token = accessToken?.trim() || (await resolveStoredAccessToken()) || "";
  if (!token) {
    throw new ProfileApiError("You are not signed in.", 401);
  }

  const request = (bearer: string) =>
    fetch(apiUrl("/accounts/profile/"), {
      headers: { Authorization: `Bearer ${bearer}` },
    });

  let res = await request(token);
  let data = await parseProfileResponse(res);

  if (isApiTokenInvalidResponse(res.status, data)) {
    const refreshed = await tryRefreshStoredAccessToken();
    if (refreshed) {
      token = refreshed;
      res = await request(token);
      data = await parseProfileResponse(res);
    }
  }

  if (!res.ok) {
    const message =
      res.status === 404
        ? "Profile service is not available (404)."
        : "Could not load your profile from the server.";
    throw new ProfileApiError(message, res.status, data);
  }

  return data;
}

const asProfileApiError = (error: unknown): ProfileApiError => {
  if (error instanceof ProfileApiError) return error;
  if (error instanceof ProfileAvatarUploadError) {
    return new ProfileApiError(error.message, error.status, error.payload);
  }
  return new ProfileApiError(
    "Could not upload your profile photo. Please try again.",
    0
  );
};

/** PATCH /accounts/profile/ with multipart field "avatar". */
export async function uploadProfileAvatar(
  selection: AvatarSelection,
  accessToken?: string
): Promise<Record<string, unknown>> {
  const prepared = prepareAvatarUploadFile(selection);
  if (!prepared.ok) {
    throw new ProfileApiError(prepared.message, 400);
  }

  let token = accessToken?.trim() || (await resolveStoredAccessToken()) || "";
  if (!token) {
    throw new ProfileApiError("You are not signed in.", 401);
  }

  const endpoint = apiUrl(PROFILE_AVATAR_PATH);
  const send = (bearer: string) =>
    executeProfileAvatarUpload({
      endpoint,
      accessToken: bearer,
      file: prepared.file,
    });

  try {
    return await send(token);
  } catch (error) {
    if (
      error instanceof ProfileAvatarUploadError &&
      isApiTokenInvalidResponse(error.status, error.payload)
    ) {
      const refreshed = await tryRefreshStoredAccessToken();
      if (refreshed) {
        try {
          return await send(refreshed);
        } catch (retryError) {
          throw asProfileApiError(retryError);
        }
      }
    }
    throw asProfileApiError(error);
  }
}
