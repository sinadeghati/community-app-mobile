type ApiErrorPayload = Record<string, unknown>;

const collectFieldMessages = (data: ApiErrorPayload): string[] => {
  const messages: string[] = [];

  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.trim()) {
      messages.push(value.trim());
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string" && entry.trim()) {
          messages.push(entry.trim());
        }
      });
    }
  }

  return messages;
};

export const formatAuthError = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  const response = (error as { response?: { data?: unknown; status?: number } })
    ?.response;

  if (response?.status === 404) {
    return "This feature is not available on the server yet. Please try again later.";
  }

  if (response?.status === 401 || response?.status === 400) {
    const data = response.data;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === "object") {
      const payload = data as ApiErrorPayload;
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        return payload.detail.trim();
      }

      const fieldMessages = collectFieldMessages(payload);
      if (fieldMessages.length > 0) {
        return fieldMessages.join("\n");
      }
    }

    return fallback;
  }

  if (!response) {
    return "We could not reach the server. Check your connection and try again.";
  }

  return fallback;
};

export const isPasswordEndpointUnavailable = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 404;
