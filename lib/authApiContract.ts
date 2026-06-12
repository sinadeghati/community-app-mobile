/**
 * Backend contract for password flows (Django REST / dj-rest-auth style).
 *
 * Required server endpoints for Private Beta:
 *
 * POST /api/accounts/password/reset/
 *   Body: { "email": "user@example.com" }
 *   Response: 200/204 on success (same response whether email exists)
 *
 * POST /api/accounts/password/change/  (Authorization: Bearer <access>)
 *   Body: { "old_password": "...", "new_password": "..." }
 *   Response: 200/204 on success
 *   Errors: 400 for weak password or wrong current password
 */
export const AUTH_PASSWORD_RESET_PATH = "/accounts/password/reset/";
export const AUTH_PASSWORD_CHANGE_PATH = "/accounts/password/change/";
