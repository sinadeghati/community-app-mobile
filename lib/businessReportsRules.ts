export type BusinessReportReason =
  | "child_safety"
  | "nudity_or_sexual_content"
  | "harassment_or_abuse"
  | "hate_or_discrimination"
  | "spam_or_scam"
  | "violence_or_dangerous_content"
  | "illegal_activity"
  | "other";

export type BusinessReportReasonOption = {
  label: string;
  value: BusinessReportReason;
};

export const BUSINESS_REPORT_REASON_OPTIONS: BusinessReportReasonOption[] = [
  { label: "Child safety concern", value: "child_safety" },
  { label: "Nudity or sexual content", value: "nudity_or_sexual_content" },
  { label: "Harassment or abuse", value: "harassment_or_abuse" },
  { label: "Hate or discrimination", value: "hate_or_discrimination" },
  { label: "Spam or scam", value: "spam_or_scam" },
  { label: "Violence or dangerous content", value: "violence_or_dangerous_content" },
  { label: "Illegal activity", value: "illegal_activity" },
  { label: "Other", value: "other" },
];

export type SubmitBusinessReportPayload = {
  target_type: "business";
  target_id: string | number;
  reason: BusinessReportReason;
  details?: string;
};

export type ReportSubmitErrorKind =
  | "unauthenticated"
  | "duplicate"
  | "invalid_target"
  | "self_report"
  | "network"
  | "server";

export type ReportSubmitResult =
  | { ok: true }
  | { ok: false; kind: ReportSubmitErrorKind; message: string };

export const BUSINESS_REPORT_SUCCESS_MESSAGE =
  "Report submitted. Thank you for helping keep Korook safe.";

const collectErrorMessages = (data: unknown): string[] => {
  const messages: string[] = [];

  if (typeof data === "string" && data.trim()) {
    messages.push(data.trim());
    return messages;
  }

  if (!data || typeof data !== "object") {
    return messages;
  }

  const payload = data as Record<string, unknown>;
  if (typeof payload.detail === "string" && payload.detail.trim()) {
    messages.push(payload.detail.trim());
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string" && value.trim()) {
      messages.push(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string" && entry.trim()) {
          messages.push(entry.trim());
        }
      });
    }
  }

  return messages;
};

const includesAny = (haystack: string, needles: string[]) =>
  needles.some((needle) => haystack.includes(needle));

export const resolveBusinessReportTargetId = (
  business: {
    id?: string | number;
    server_listing_id?: string | number;
    listing_id?: string | number;
  },
  profileId?: string
): string => {
  const serverId = business.server_listing_id ?? business.listing_id;
  if (serverId != null && String(serverId).trim()) {
    return String(serverId).trim();
  }

  const fallback = business.id ?? profileId;
  return String(fallback || "").trim();
};

export const classifyReportSubmitError = (
  error: unknown
): { kind: ReportSubmitErrorKind; message: string } => {
  const response = (error as { response?: { status?: number; data?: unknown } })
    ?.response;

  if (!response) {
    return {
      kind: "network",
      message: "We could not reach the server. Check your connection and try again.",
    };
  }

  const status = response.status ?? 0;
  const haystack = collectErrorMessages(response.data).join(" ").toLowerCase();

  if (status === 401) {
    return {
      kind: "unauthenticated",
      message: "Please log in to report this business.",
    };
  }

  if (
    status === 409 ||
    includesAny(haystack, ["already reported", "duplicate report", "already submitted"])
  ) {
    return {
      kind: "duplicate",
      message: "You have already reported this business.",
    };
  }

  if (
    includesAny(haystack, ["own business", "your own", "cannot report yourself", "self-report", "self report"])
  ) {
    return {
      kind: "self_report",
      message: "You cannot report your own business.",
    };
  }

  if (
    status === 404 ||
    includesAny(haystack, ["invalid target", "not found", "does not exist", "unknown target"])
  ) {
    return {
      kind: "invalid_target",
      message: "This business could not be reported. It may no longer be available.",
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      message: "Something went wrong on our side. Please try again later.",
    };
  }

  const fieldMessage = collectErrorMessages(response.data)[0];
  return {
    kind: "server",
    message:
      fieldMessage ||
      "Could not submit your report right now. Please try again.",
  };
};
