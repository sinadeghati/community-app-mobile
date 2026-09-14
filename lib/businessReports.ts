import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import { resolveStoredAccessToken } from "./authSession";
import authStorage from "../app/utils/authStorage";
import {
  classifyReportSubmitError,
  type ReportSubmitResult,
  type SubmitBusinessReportPayload,
} from "./businessReportsRules";

export type {
  BusinessReportReason,
  BusinessReportReasonOption,
  ReportSubmitErrorKind,
  ReportSubmitResult,
  SubmitBusinessReportPayload,
} from "./businessReportsRules";

export {
  BUSINESS_REPORT_REASON_OPTIONS,
  BUSINESS_REPORT_SUCCESS_MESSAGE,
  classifyReportSubmitError,
  resolveBusinessReportTargetId,
} from "./businessReportsRules";

const reportsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const submitBusinessReport = async (
  payload: SubmitBusinessReportPayload
): Promise<ReportSubmitResult> => {
  const access = await resolveStoredAccessToken();
  if (!access || !authStorage.isJwtNotExpired(access)) {
    return {
      ok: false,
      kind: "unauthenticated",
      message: "Please log in to report this business.",
    };
  }

  try {
    await reportsClient.post(
      "/reports/",
      {
        target_type: payload.target_type,
        target_id: payload.target_id,
        reason: payload.reason,
        details: payload.details?.trim() || "",
      },
      {
        headers: {
          Authorization: `Bearer ${access.trim()}`,
        },
      }
    );

    return { ok: true };
  } catch (error) {
    const classified = classifyReportSubmitError(error);
    return {
      ok: false,
      kind: classified.kind,
      message: classified.message,
    };
  }
};
