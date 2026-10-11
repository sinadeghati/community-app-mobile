const LOCAL_EVENT_IMAGE_PREFIXES = ["file:", "content:", "ph:", "assets-library:"];

export const isLocalEventMediaUri = (uri: string | null | undefined): boolean => {
  const value = String(uri || "").trim();
  if (!value) return false;
  const lower = value.toLowerCase();
  if (LOCAL_EVENT_IMAGE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return true;
  }
  return false;
};

export const resolveEventCoverMimeType = (uri: string, filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "png") return "image/png";
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  const lowerUri = uri.toLowerCase();
  if (lowerUri.includes(".png")) return "image/png";
  if (lowerUri.includes(".heic") || lowerUri.includes(".heif")) return "image/heic";
  return "image/jpeg";
};

export const buildEventCoverFilePart = (uri: string) => {
  const trimmed = uri.trim();
  const filename =
    trimmed.split("/").pop()?.split("?")[0] || `event_flyer_${Date.now()}.jpg`;
  return {
    uri: trimmed,
    name: filename,
    type: resolveEventCoverMimeType(trimmed, filename),
  };
};

export const appendEventFieldsToFormData = (
  formData: FormData,
  payload: Record<string, unknown>
) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }
    formData.append(key, String(value));
  });
};

export const pickLocalEventCoverUri = (
  ...candidates: Array<string | null | undefined>
): string | undefined => {
  for (const candidate of candidates) {
    const uri = String(candidate || "").trim();
    if (isLocalEventMediaUri(uri)) return uri;
  }
  return undefined;
};
