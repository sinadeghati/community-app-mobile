export const formatServerEventApiError = (error: unknown): string => {
  const fallback = "Could not save the event. Check your connection and try again.";
  if (!error || typeof error !== "object") return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (!data) {
    return (error as { message?: string }).message || fallback;
  }
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
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
