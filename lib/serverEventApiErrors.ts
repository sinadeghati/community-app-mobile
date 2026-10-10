const HTML_ERROR_PATTERN = /<!doctype html|<html[\s>]/i;

const isHtmlErrorBody = (value: string) => HTML_ERROR_PATTERN.test(value.trim());

export const formatServerEventApiError = (error: unknown): string => {
  const fallback =
    "Could not save the event. Check your connection and try again.";
  if (!error || typeof error !== "object") return fallback;

  const axiosError = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (status && status >= 500) {
    return "The server could not save your event. Please try again in a moment.";
  }

  if (!data) {
    const message = axiosError.message || "";
    if (isHtmlErrorBody(message)) return fallback;
    return message || fallback;
  }

  if (typeof data === "string") {
    if (isHtmlErrorBody(data)) return fallback;
    const trimmed = data.trim();
    return trimmed || fallback;
  }

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") {
      if (isHtmlErrorBody(record.detail)) return fallback;
      return record.detail;
    }
    const parts: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        parts.push(value);
      }
    }
    if (parts.length) return parts.join("\n");
  }

  return fallback;
};
