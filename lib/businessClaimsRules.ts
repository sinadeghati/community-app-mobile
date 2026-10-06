import { resolveBusinessReportTargetId } from "./businessReportsRules";

export type BusinessClaimSubmitPayload = {
  listingId: string;
  claimant_name: string;
  relationship_role: string;
  contact_email: string;
  contact_phone: string;
  verification_message: string;
};

export type ClaimSubmitErrorKind =
  | "unauthenticated"
  | "validation"
  | "duplicate"
  | "already_claimed"
  | "network"
  | "server";

export type ClaimSubmitResult =
  | { ok: true; message: string }
  | { ok: false; kind: ClaimSubmitErrorKind; message: string };

export type ClaimStatusResult =
  | {
      ok: true;
      is_unclaimed: boolean;
      user_claim_status: string | null;
    }
  | { ok: false; kind: ClaimSubmitErrorKind; message: string };

export const BUSINESS_CLAIM_SUCCESS_MESSAGE =
  "Your claim request has been submitted for review.";

export const BUSINESS_CLAIM_REVIEW_NOTICE =
  "Submitting a claim does not grant ownership immediately. Korook will review your request.";

export const resolveBusinessClaimListingId = (
  business: {
    id?: string | number;
    server_listing_id?: string | number;
    listing_id?: string | number;
  },
  profileId?: string
): string => resolveBusinessReportTargetId(business, profileId);

const readDetail = (data: unknown): string => {
  if (!data || typeof data !== "object") return "";
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return String(detail[0]);
  }
  return "";
};

export const classifyClaimSubmitError = (
  error: unknown
): { kind: ClaimSubmitErrorKind; message: string } => {
  const response = (error as { response?: { status?: number; data?: unknown } })
    ?.response;

  if (!response) {
    return {
      kind: "network",
      message: "We could not reach the server. Check your connection and try again.",
    };
  }

  const status = response.status ?? 0;
  const detail = readDetail(response.data);

  if (status === 401) {
    return {
      kind: "unauthenticated",
      message: detail || "Please log in to claim this business.",
    };
  }
  if (status === 400 && /pending claim/i.test(detail)) {
    return { kind: "duplicate", message: detail };
  }
  if (status === 400 && /already has an owner/i.test(detail)) {
    return { kind: "already_claimed", message: detail };
  }
  if (status === 400) {
    return { kind: "validation", message: detail || "Please check the form and try again." };
  }

  return {
    kind: "server",
    message: detail || "Something went wrong. Please try again later.",
  };
};
