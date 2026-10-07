import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import { resolveStoredAccessToken } from "./authSession";
import authStorage from "../app/utils/authStorage";
import {
  classifyClaimSubmitError,
  type BusinessClaimSubmitPayload,
  type ClaimStatusResult,
  type ClaimSubmitResult,
} from "./businessClaimsRules";

export type {
  BusinessClaimSubmitPayload,
  ClaimStatusResult,
  ClaimSubmitResult,
} from "./businessClaimsRules";

export {
  BUSINESS_CLAIM_REVIEW_NOTICE,
  BUSINESS_CLAIM_SUCCESS_MESSAGE,
  resolveBusinessClaimListingId,
} from "./businessClaimsRules";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const authHeaders = async () => {
  const access = await resolveStoredAccessToken();
  if (!access || !authStorage.isJwtNotExpired(access)) {
    return null;
  }
  return { Authorization: `Bearer ${access.trim()}` };
};

export const fetchBusinessClaimStatus = async (
  listingId: string
): Promise<ClaimStatusResult> => {
  const trimmed = String(listingId || "").trim();
  if (!trimmed) {
    return { ok: false, kind: "validation", message: "Missing business id." };
  }

  try {
    const headers = await authHeaders();
    const response = await client.get(`/listings/${trimmed}/claim/`, {
      headers: headers ?? undefined,
    });
    const data = response.data as {
      is_unclaimed?: boolean;
      user_claim_status?: string | null;
    };
    return {
      ok: true,
      is_unclaimed: Boolean(data.is_unclaimed),
      user_claim_status: data.user_claim_status ?? null,
    };
  } catch (error) {
    const classified = classifyClaimSubmitError(error);
    return { ok: false, kind: classified.kind, message: classified.message };
  }
};

export const submitBusinessClaim = async (
  payload: BusinessClaimSubmitPayload
): Promise<ClaimSubmitResult> => {
  const headers = await authHeaders();
  if (!headers) {
    return {
      ok: false,
      kind: "unauthenticated",
      message: "Please log in to claim this business.",
    };
  }

  const listingId = String(payload.listingId || "").trim();
  if (!listingId || !/^\d+$/.test(listingId)) {
    return {
      ok: false,
      kind: "validation",
      message:
        "This business is not linked to a valid server listing. Refresh the profile and try again.",
    };
  }

  try {
    const response = await client.post(
      `/listings/${listingId}/claim/`,
      {
        claimant_name: payload.claimant_name.trim(),
        relationship_role: payload.relationship_role.trim(),
        contact_email: payload.contact_email.trim(),
        contact_phone: payload.contact_phone.trim(),
        verification_message: payload.verification_message.trim(),
      },
      { headers }
    );
    const message =
      typeof response.data?.message === "string"
        ? response.data.message
        : "Your claim request has been submitted for review.";
    return { ok: true, message };
  } catch (error) {
    const classified = classifyClaimSubmitError(error);
    return { ok: false, kind: classified.kind, message: classified.message };
  }
};
