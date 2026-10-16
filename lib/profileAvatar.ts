/** Account avatar upload and merge rules. Local file URIs are previews only. */

export const PROFILE_AVATAR_PATH = "/accounts/profile/";
export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_TYPE_ERROR = "Choose a JPEG, PNG, or WEBP photo.";
export const AVATAR_SIZE_ERROR = "Photo must be 5 MB or smaller.";
export const AVATAR_READ_ERROR = "Could not read the selected photo.";
export const AVATAR_UNSAVED_ERROR =
  "Could not upload your profile photo. Please try again.";
export const AVATAR_URL_MISSING_ERROR =
  "The server did not return a saved photo URL. Your photo was not saved.";
export const AVATAR_OFFLINE_ERROR =
  "Could not reach the server. Your photo was not saved.";
export const AVATAR_AUTH_ERROR = "Sign in again to update your photo.";

const LOCAL_AVATAR_PREFIXES = [
  "file:",
  "content:",
  "ph:",
  "assets-library:",
  "blob:",
];

const PERSISTED_AVATAR_KEYS = [
  "avatar_url",
  "profileImage",
  "profile_image",
] as const;

export type AvatarSelection = {
  uri: string;
  mimeType?: string | null;
  type?: string | null;
  fileName?: string | null;
  name?: string | null;
  fileSize?: number | null;
};

export type PreparedAvatarFile = {
  uri: string;
  name: string;
  type: string;
};

export type AvatarUploadBody = {
  append(name: string, value: unknown): void;
};

export type AvatarFetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export type AvatarFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export class ProfileAvatarUploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message);
    this.name = "ProfileAvatarUploadError";
  }
}

export const isLocalAvatarUri = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return LOCAL_AVATAR_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export const isHttpsAvatarUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
};

/** HTTPS URL already stored on the account. Local file URIs are ignored. */
export const readPersistedAvatarUrl = (
  source: Record<string, unknown> | null | undefined
): string | null => {
  if (!source) return null;
  for (const key of PERSISTED_AVATAR_KEYS) {
    const value = source[key];
    if (isHttpsAvatarUrl(value)) return value.trim();
  }
  return null;
};

/** Server field from GET or PATCH /accounts/profile/. */
export const readServerAvatarUrl = (
  source: Record<string, unknown> | null | undefined
): string | null => {
  if (!source || !isHttpsAvatarUrl(source.avatar_url)) return null;
  return source.avatar_url.trim();
};

/**
 * Successful profile payloads are authoritative for avatar_url.
 * A missing avatar_url keeps a previously stored HTTPS URL and drops file://.
 */
export const resolveAvatarUrlForProfileMerge = (
  cached: Record<string, unknown> | null | undefined,
  api: Record<string, unknown> | null | undefined
): string | null => {
  if (api && Object.prototype.hasOwnProperty.call(api, "avatar_url")) {
    return readServerAvatarUrl(api);
  }
  return readPersistedAvatarUrl(cached);
};

export const applyAvatarMerge = <T extends Record<string, unknown>>(
  merged: T,
  cached: Record<string, unknown> | null | undefined,
  api: Record<string, unknown> | null | undefined
): T & {
  avatar_url: string | null;
  profileImage: string | null;
  profile_image: string | null;
} => {
  const avatarUrl = resolveAvatarUrlForProfileMerge(cached, api);
  return {
    ...merged,
    avatar_url: avatarUrl,
    profileImage: avatarUrl,
    profile_image: avatarUrl,
  };
};

export const profileWithUploadedAvatar = (
  profile: Record<string, unknown>,
  avatarUrl: string
): Record<string, unknown> => {
  const url = avatarUrl.trim();
  if (!isHttpsAvatarUrl(url)) {
    throw new Error(AVATAR_URL_MISSING_ERROR);
  }
  return {
    ...profile,
    avatar_url: url,
    profileImage: url,
    profile_image: url,
  };
};

export const avatarUriForDisplay = (input: {
  previewUri?: string | null;
  persistedUri?: string | null;
  placeholder: string;
}): string => {
  const preview = String(input.previewUri || "").trim();
  if (preview) return preview;
  if (isHttpsAvatarUrl(input.persistedUri)) return input.persistedUri.trim();
  return input.placeholder;
};

export type AvatarUploadSettlement = {
  saved: boolean;
  previewUri: null;
  displayUrl: string | null;
  profileToPersist: Record<string, unknown> | null;
  error: string | null;
};

/** Success stores only the HTTPS avatar_url. Failure leaves storage unchanged. */
export const settleAvatarUpload = (input: {
  previousProfile: Record<string, unknown> | null;
  localPreviewUri: string;
  outcome:
    | { ok: true; profile: Record<string, unknown> }
    | { ok: false; message: string };
}): AvatarUploadSettlement => {
  const previousUrl = readPersistedAvatarUrl(input.previousProfile);
  if (!input.outcome.ok) {
    return {
      saved: false,
      previewUri: null,
      displayUrl: previousUrl,
      profileToPersist: null,
      error: input.outcome.message,
    };
  }

  const avatarUrl = readServerAvatarUrl(input.outcome.profile);
  if (!avatarUrl) {
    return {
      saved: false,
      previewUri: null,
      displayUrl: previousUrl,
      profileToPersist: null,
      error: AVATAR_URL_MISSING_ERROR,
    };
  }

  const profileToPersist = profileWithUploadedAvatar(
    input.previousProfile ?? {},
    avatarUrl
  );
  const persistedFields = [
    profileToPersist.avatar_url,
    profileToPersist.profileImage,
    profileToPersist.profile_image,
  ];
  if (persistedFields.some((value) => isLocalAvatarUri(value))) {
    return {
      saved: false,
      previewUri: null,
      displayUrl: previousUrl,
      profileToPersist: null,
      error: AVATAR_URL_MISSING_ERROR,
    };
  }

  return {
    saved: true,
    previewUri: null,
    displayUrl: avatarUrl,
    profileToPersist,
    error: null,
  };
};

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "public.jpeg": "image/jpeg",
  "public.jpg": "image/jpeg",
  "public.png": "image/png",
  "public.webp": "image/webp",
  "org.webmproject.webp": "image/webp",
};

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "application/binary",
]);

const normalizeMimeType = (value: string | null | undefined): string | null => {
  const mime = String(value || "").trim().toLowerCase();
  if (!mime || GENERIC_MIME_TYPES.has(mime)) return null;
  const alias = MIME_ALIASES[mime] || mime;
  if (alias === "image/jpeg" || alias === "image/png" || alias === "image/webp") {
    return alias;
  }
  return null;
};

const extensionForMime = (mime: string): string => {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
};

const mimeFromFileName = (value: string | null | undefined): string | null => {
  const name = String(value || "").split("?")[0].toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return null;
};

export const prepareAvatarUploadFile = (
  selection: AvatarSelection
): { ok: true; file: PreparedAvatarFile } | { ok: false; message: string } => {
  const uri = String(selection.uri || "").trim();
  if (!uri) return { ok: false, message: AVATAR_READ_ERROR };

  const fileSize = selection.fileSize;
  if (
    typeof fileSize === "number" &&
    Number.isFinite(fileSize) &&
    fileSize > PROFILE_AVATAR_MAX_BYTES
  ) {
    return { ok: false, message: AVATAR_SIZE_ERROR };
  }

  const explicit = String(selection.mimeType || selection.type || "")
    .trim()
    .toLowerCase();
  const explicitMime = GENERIC_MIME_TYPES.has(explicit)
    ? null
    : normalizeMimeType(explicit);
  if (explicit && !GENERIC_MIME_TYPES.has(explicit) && !explicitMime) {
    return { ok: false, message: AVATAR_TYPE_ERROR };
  }

  const mime =
    explicitMime ||
    mimeFromFileName(selection.fileName || selection.name) ||
    mimeFromFileName(uri);
  if (!mime) return { ok: false, message: AVATAR_TYPE_ERROR };

  const rawName = String(selection.fileName || selection.name || "")
    .trim()
    .split("?")[0];
  const fallbackName = String(uri.split("/").pop() || uri.split("\\").pop() || "")
    .split("?")[0];
  const baseName = (rawName || fallbackName).split("/").pop()?.split("\\").pop() || "";
  const stem = baseName.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]/g, "") || "avatar";
  const name = `${stem}.${extensionForMime(mime)}`;

  return { ok: true, file: { uri, name, type: mime } };
};

const firstAvatarMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) return entry.trim();
    }
  }
  return null;
};

export const messageFromAvatarPayload = (
  status: number,
  payload: unknown
): string => {
  if (status === 413) return AVATAR_SIZE_ERROR;
  if (status === 0) return AVATAR_OFFLINE_ERROR;

  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  const avatarMessage = firstAvatarMessage(record?.avatar);
  if (avatarMessage) return avatarMessage;
  if (typeof record?.detail === "string" && record.detail.trim()) {
    return record.detail.trim();
  }
  if (status === 401) return AVATAR_AUTH_ERROR;
  return AVATAR_UNSAVED_ERROR;
};

export const appendAvatarFile = (
  formData: AvatarUploadBody,
  file: PreparedAvatarFile
) => {
  formData.append("avatar", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
};

export async function executeProfileAvatarUpload(options: {
  endpoint: string;
  accessToken: string;
  file: PreparedAvatarFile;
  fetchImpl?: (url: string, init: AvatarFetchInit) => Promise<AvatarFetchResponse>;
  createFormData?: () => AvatarUploadBody;
}): Promise<Record<string, unknown>> {
  const formData = (
    options.createFormData ?? (() => new FormData() as AvatarUploadBody)
  )();
  appendAvatarFile(formData, options.file);

  const fetchImpl =
    options.fetchImpl ??
    (async (url: string, init: AvatarFetchInit) => {
      const res = await fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body as BodyInit,
      });
      return res;
    });

  let res: AvatarFetchResponse;
  try {
    res = await fetchImpl(options.endpoint, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${options.accessToken}` },
      body: formData,
    });
  } catch {
    throw new ProfileAvatarUploadError(messageFromAvatarPayload(0, null), 0);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new ProfileAvatarUploadError(
      messageFromAvatarPayload(res.status, payload),
      res.status,
      payload
    );
  }

  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  if (!readServerAvatarUrl(record)) {
    throw new ProfileAvatarUploadError(
      AVATAR_URL_MISSING_ERROR,
      res.status,
      payload
    );
  }

  return record as Record<string, unknown>;
}
