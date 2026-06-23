/**
 * Backend contract for auth flows (Django REST / dj-rest-auth style).
 *
 * Required server endpoints for Private Beta:
 *
 * POST /api/accounts/password/reset/
 *   Body: { "email": "user@example.com" }
 *   Response: 200/204 on success (same response whether email exists)
 *
 * POST /api/accounts/password/change/  (Authorization: Bearer <access>)
 *   Body: {
 *     "current_password": "...",
 *     "new_password": "...",
 *     "confirm_password": "..."
 *   }
 *   Response: 200/204 on success
 *   Errors: 400 for weak password or wrong current password
 *
 * POST /api/accounts/email/verify/
 *   Body: { "email": "user@example.com", "code": "123456" }
 *   Response: 200 with { "access", "refresh" } or 204 on success
 *   Errors: 400 invalid/expired code; 404 if not enabled on server
 *
 * POST /api/accounts/email/resend/
 *   Body: { "email": "user@example.com" }
 *   Response: 200/204 (same response whether email exists)
 *
 * DELETE /api/accounts/delete/  (Authorization: Bearer <access>)
 *   Response: 204 on success
 *   Errors: 401 unauthorized; 404 if not enabled on server
 */
export const AUTH_PASSWORD_RESET_PATH = "/accounts/password/reset/";
export const AUTH_PASSWORD_CHANGE_PATH = "/accounts/password/change/";
export const AUTH_EMAIL_VERIFY_PATH = "/accounts/email/verify/";
export const AUTH_EMAIL_RESEND_PATH = "/accounts/email/resend/";
export const AUTH_DELETE_ACCOUNT_PATH = "/accounts/delete/";
