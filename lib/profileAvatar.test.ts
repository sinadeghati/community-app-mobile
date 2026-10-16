/**
 * Run: npx tsx lib/profileAvatar.test.ts
 */
import { apiUrl } from "./apiConfig";
import {
  AVATAR_OFFLINE_ERROR,
  AVATAR_SIZE_ERROR,
  AVATAR_TYPE_ERROR,
  AVATAR_URL_MISSING_ERROR,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_PATH,
  applyAvatarMerge,
  avatarUriForDisplay,
  executeProfileAvatarUpload,
  prepareAvatarUploadFile,
  settleAvatarUpload,
  type AvatarFetchInit,
  type AvatarUploadBody,
} from "./profileAvatar";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const assertRejects = async (
  label: string,
  run: () => Promise<unknown>,
  expected: string
) => {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(expected)) {
      throw new Error(`FAIL: ${label} (message was ${message})`);
    }
    console.log(`ok: ${label}`);
    return;
  }
  throw new Error(`FAIL: ${label} (did not throw)`);
};

const LOCAL_PREVIEW = "file:///var/mobile/Containers/Data/avatar.jpg";
const PREVIOUS_HTTPS = "https://cdn.example.com/avatars/previous.jpg";
const UPLOADED_HTTPS = "https://cdn.example.com/avatars/7.jpg";
const PLACEHOLDER = "placeholder://avatar";

assert(
  "avatar upload targets the account profile path",
  PROFILE_AVATAR_PATH === "/accounts/profile/" &&
    apiUrl(PROFILE_AVATAR_PATH).endsWith("/accounts/profile/")
);

const jpeg = prepareAvatarUploadFile({
  uri: LOCAL_PREVIEW,
  mimeType: "image/jpg",
  fileName: "avatar.JPEG",
  fileSize: PROFILE_AVATAR_MAX_BYTES,
});
assert("jpeg at 5 MB is accepted", jpeg.ok === true && jpeg.ok && jpeg.file.type === "image/jpeg");

const png = prepareAvatarUploadFile({
  uri: "content://media/picker/1",
  fileName: "photo.png",
});
assert("png extension is accepted", png.ok === true && png.ok && png.file.type === "image/png");

const webp = prepareAvatarUploadFile({
  uri: "file:///tmp/photo.webp",
  mimeType: "image/webp",
});
assert("webp is accepted", webp.ok === true && webp.ok && webp.file.name === "photo.webp");

const iosCroppedJpeg = prepareAvatarUploadFile({
  uri: "file:///var/mobile/Containers/Data/tmp/ImagePicker/crop.jpg",
  mimeType: "public.jpeg",
  fileName: "IMG_0001.HEIC",
});
assert(
  "iOS cropped JPEG keeps a jpeg name and MIME even when the original file was HEIC",
  iosCroppedJpeg.ok === true &&
    iosCroppedJpeg.ok &&
    iosCroppedJpeg.file.type === "image/jpeg" &&
    iosCroppedJpeg.file.name === "IMG_0001.jpg" &&
    iosCroppedJpeg.file.uri.startsWith("file:")
);

const androidPng = prepareAvatarUploadFile({
  uri: "content://media/external/images/media/55",
  mimeType: "image/png",
});
assert(
  "Android content URI PNG gets a png filename and MIME",
  androidPng.ok === true &&
    androidPng.ok &&
    androidPng.file.type === "image/png" &&
    androidPng.file.name === "55.png" &&
    androidPng.file.uri.startsWith("content:")
);

const androidWebp = prepareAvatarUploadFile({
  uri: "content://media/picker/webp%20photo",
  mimeType: "image/webp",
  fileName: "My Photo.WEBP",
});
assert(
  "Android WEBP filename is sanitized and matches the MIME type",
  androidWebp.ok === true &&
    androidWebp.ok &&
    androidWebp.file.type === "image/webp" &&
    androidWebp.file.name === "MyPhoto.webp"
);

const heic = prepareAvatarUploadFile({
  uri: "file:///tmp/photo.heic",
  mimeType: "image/heic",
});
assert(
  "heic is rejected",
  heic.ok === false && !heic.ok && heic.message === AVATAR_TYPE_ERROR
);

const oversized = prepareAvatarUploadFile({
  uri: LOCAL_PREVIEW,
  mimeType: "image/jpeg",
  fileSize: PROFILE_AVATAR_MAX_BYTES + 1,
});
assert(
  "photos over 5 MB are rejected",
  oversized.ok === false && !oversized.ok && oversized.message === AVATAR_SIZE_ERROR
);

const main = async () => {
type RecordedPart = { name: string; value: unknown };
const recorded: RecordedPart[] = [];
const formData: AvatarUploadBody = {
  append(name: string, value: unknown) {
    recorded.push({ name, value });
  },
};
let seen: AvatarFetchInit & { url?: string } = {};

const uploaded = await executeProfileAvatarUpload({
  endpoint: apiUrl(PROFILE_AVATAR_PATH),
  accessToken: "token-123",
  file: { uri: LOCAL_PREVIEW, name: "avatar.jpg", type: "image/jpeg" },
  createFormData: () => formData,
  fetchImpl: async (url, init) => {
    seen = { url, ...init };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "7",
        username: "ada",
        avatar_url: `  ${UPLOADED_HTTPS}  `,
      }),
    };
  },
});

const part = recorded[0]?.value as { uri?: string; name?: string; type?: string };
assert("multipart body has a single avatar field", recorded.length === 1 && recorded[0]?.name === "avatar");
assert(
  "avatar part uses the local file only as the upload body",
  part?.uri === LOCAL_PREVIEW && part?.name === "avatar.jpg" && part?.type === "image/jpeg"
);
assert("upload is a PATCH to the profile endpoint", seen.method === "PATCH" && seen.url === apiUrl(PROFILE_AVATAR_PATH));
assert(
  "upload sends the bearer token and lets fetch set the multipart boundary",
  seen.headers?.Authorization === "Bearer token-123" &&
    Object.keys(seen.headers || {}).join(",") === "Authorization"
);

const previousProfile = {
  id: "7",
  username: "ada",
  bio: "Hello",
  profileImage: LOCAL_PREVIEW,
  profile_image: LOCAL_PREVIEW,
  avatar_url: PREVIOUS_HTTPS,
};
const saved = settleAvatarUpload({
  previousProfile,
  localPreviewUri: LOCAL_PREVIEW,
  outcome: { ok: true, profile: uploaded },
});
assert("successful upload is marked saved", saved.saved === true && saved.error === null && saved.previewUri === null);
assert(
  "successful upload persists the HTTPS avatar_url",
  saved.displayUrl === UPLOADED_HTTPS &&
    saved.profileToPersist?.avatar_url === UPLOADED_HTTPS &&
    saved.profileToPersist?.profileImage === UPLOADED_HTTPS &&
    saved.profileToPersist?.profile_image === UPLOADED_HTTPS
);
assert(
  "successful upload does not persist the local file URI",
  saved.profileToPersist?.avatar_url !== LOCAL_PREVIEW &&
    saved.profileToPersist?.profileImage !== LOCAL_PREVIEW &&
    saved.profileToPersist?.profile_image !== LOCAL_PREVIEW &&
    saved.profileToPersist?.bio === "Hello"
);
assert(
  "temporary preview is replaced by the HTTPS url for display",
  avatarUriForDisplay({
    previewUri: LOCAL_PREVIEW,
    persistedUri: PREVIOUS_HTTPS,
    placeholder: PLACEHOLDER,
  }) === LOCAL_PREVIEW &&
    avatarUriForDisplay({
      previewUri: saved.previewUri,
      persistedUri: saved.displayUrl,
      placeholder: PLACEHOLDER,
    }) === UPLOADED_HTTPS
);

const serverOverLocal = applyAvatarMerge(
  {
    id: "7",
    username: "ada",
    profileImage: LOCAL_PREVIEW,
    profile_image: LOCAL_PREVIEW,
  },
  {
    id: "7",
    profileImage: LOCAL_PREVIEW,
    profile_image: LOCAL_PREVIEW,
  },
  {
    id: "7",
    username: "ada",
    avatar_url: UPLOADED_HTTPS,
  }
);
assert(
  "profile merge prefers backend avatar_url over a stale local file URI",
  serverOverLocal.avatar_url === UPLOADED_HTTPS &&
    serverOverLocal.profileImage === UPLOADED_HTTPS &&
    serverOverLocal.profile_image === UPLOADED_HTTPS
);

const cleared = applyAvatarMerge(
  { id: "7", profileImage: LOCAL_PREVIEW, profile_image: LOCAL_PREVIEW },
  { id: "7", profileImage: LOCAL_PREVIEW, profile_image: LOCAL_PREVIEW },
  { id: "7", username: "ada", avatar_url: null }
);
assert(
  "profile merge drops a local file URI when the server has no avatar",
  cleared.avatar_url === null &&
    cleared.profileImage === null &&
    cleared.profile_image === null
);
assert(
  "placeholder is used when no server avatar exists",
  avatarUriForDisplay({
    previewUri: null,
    persistedUri: cleared.profileImage,
    placeholder: PLACEHOLDER,
  }) === PLACEHOLDER
);

const keptHttps = applyAvatarMerge(
  { id: "7", avatar_url: PREVIOUS_HTTPS, profileImage: LOCAL_PREVIEW },
  { id: "7", avatar_url: PREVIOUS_HTTPS, profileImage: LOCAL_PREVIEW },
  { id: "7", username: "ada" }
);
assert(
  "profile merge keeps a stored HTTPS avatar when avatar_url is absent and ignores file URIs",
  keptHttps.avatar_url === PREVIOUS_HTTPS &&
    keptHttps.profileImage === PREVIOUS_HTTPS &&
    keptHttps.profile_image === PREVIOUS_HTTPS
);

const replacedHttps = applyAvatarMerge(
  { id: "7", avatar_url: PREVIOUS_HTTPS },
  { id: "7", avatar_url: PREVIOUS_HTTPS },
  { id: "7", avatar_url: UPLOADED_HTTPS }
);
assert(
  "profile merge replaces an older HTTPS avatar with the backend avatar_url",
  replacedHttps.avatar_url === UPLOADED_HTTPS &&
    replacedHttps.profileImage === UPLOADED_HTTPS
);

await assertRejects(
  "failed upload does not return a saved avatar",
  () =>
    executeProfileAvatarUpload({
      endpoint: apiUrl(PROFILE_AVATAR_PATH),
      accessToken: "token-123",
      file: { uri: LOCAL_PREVIEW, name: "avatar.jpg", type: "image/jpeg" },
      createFormData: () => ({
        append() {
          /* recorded by the caller */
        },
      }),
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        json: async () => ({ avatar: ["Upload failed."] }),
      }),
    }),
  "Upload failed."
);

await assertRejects(
  "non-HTTPS avatar_url is not treated as saved",
  () =>
    executeProfileAvatarUpload({
      endpoint: apiUrl(PROFILE_AVATAR_PATH),
      accessToken: "token-123",
      file: { uri: LOCAL_PREVIEW, name: "avatar.jpg", type: "image/jpeg" },
      createFormData: () => ({
        append() {
          /* no-op */
        },
      }),
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ avatar_url: LOCAL_PREVIEW }),
      }),
    }),
  AVATAR_URL_MISSING_ERROR
);

await assertRejects(
  "network failures stay unsaved",
  () =>
    executeProfileAvatarUpload({
      endpoint: apiUrl(PROFILE_AVATAR_PATH),
      accessToken: "token-123",
      file: { uri: LOCAL_PREVIEW, name: "avatar.jpg", type: "image/jpeg" },
      createFormData: () => ({
        append() {
          /* no-op */
        },
      }),
      fetchImpl: async () => {
        throw new Error("network down");
      },
    }),
  AVATAR_OFFLINE_ERROR
);

const failed = settleAvatarUpload({
  previousProfile: {
    id: "7",
    bio: "Hello",
    avatar_url: PREVIOUS_HTTPS,
    profileImage: LOCAL_PREVIEW,
  },
  localPreviewUri: LOCAL_PREVIEW,
  outcome: { ok: false, message: "Upload failed." },
});
assert(
  "failed upload does not persist the local preview or replace the previous photo",
  failed.saved === false &&
    failed.profileToPersist === null &&
    failed.previewUri === null &&
    failed.displayUrl === PREVIOUS_HTTPS &&
    failed.error === "Upload failed."
);
assert(
  "failed upload display falls back to the stored HTTPS photo, not the local file",
  avatarUriForDisplay({
    previewUri: failed.previewUri,
    persistedUri: failed.displayUrl,
    placeholder: PLACEHOLDER,
  }) === PREVIOUS_HTTPS
);

const failedWithoutServerAvatar = settleAvatarUpload({
  previousProfile: { id: "7", profileImage: LOCAL_PREVIEW },
  localPreviewUri: LOCAL_PREVIEW,
  outcome: { ok: false, message: AVATAR_OFFLINE_ERROR },
});
assert(
  "failed upload without a server avatar uses the placeholder",
  failedWithoutServerAvatar.saved === false &&
    failedWithoutServerAvatar.displayUrl === null &&
    avatarUriForDisplay({
      previewUri: failedWithoutServerAvatar.previewUri,
      persistedUri: failedWithoutServerAvatar.displayUrl,
      placeholder: PLACEHOLDER,
    }) === PLACEHOLDER
);

console.log("profileAvatar tests passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
