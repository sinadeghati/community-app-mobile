/**
 * Run: npx tsx lib/businessReports.test.ts
 */
import {
  BUSINESS_REPORT_REASON_OPTIONS,
  classifyReportSubmitError,
  resolveBusinessReportTargetId,
} from "./businessReportsRules";

const assert = (label: string, condition: boolean) => {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`ok: ${label}`);
};

assert(
  "reason options include child safety and other",
  BUSINESS_REPORT_REASON_OPTIONS.length === 8 &&
    BUSINESS_REPORT_REASON_OPTIONS[0].value === "child_safety" &&
    BUSINESS_REPORT_REASON_OPTIONS[7].value === "other"
);

assert(
  "prefers server listing id for report target",
  resolveBusinessReportTargetId(
    { id: "local-1", server_listing_id: 42, listing_id: 41 },
    "local-1"
  ) === "42"
);

assert(
  "falls back to profile id when business id missing",
  resolveBusinessReportTargetId({}, "profile-9") === "profile-9"
);

assert(
  "401 maps to unauthenticated",
  classifyReportSubmitError({ response: { status: 401, data: { detail: "Auth" } } })
    .kind === "unauthenticated"
);

assert(
  "409 maps to duplicate",
  classifyReportSubmitError({
    response: { status: 409, data: { detail: "Already reported" } },
  }).kind === "duplicate"
);

assert(
  "404 maps to invalid target",
  classifyReportSubmitError({
    response: { status: 404, data: { detail: "Not found" } },
  }).kind === "invalid_target"
);

assert(
  "self-report message maps to self_report",
  classifyReportSubmitError({
    response: { status: 400, data: { detail: "Cannot report your own business" } },
  }).kind === "self_report"
);

assert(
  "network error maps to network",
  classifyReportSubmitError(new Error("Network Error")).kind === "network"
);

console.log("businessReports.test.ts: all passed");
