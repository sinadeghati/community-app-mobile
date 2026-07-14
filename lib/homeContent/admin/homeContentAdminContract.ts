/**
 * Backend contract for Home Content admin (Django REST — not implemented yet).
 *
 * Auth: staff / role `home_content_editor` (separate from business listing APIs).
 *
 * Public read (mobile):
 * - GET  /api/home-content/manifest/
 * - HEAD /api/home-content/manifest/
 *   Query: env=staging|production, platform=ios|android, locale=en|fa (future)
 *   Headers: ETag, Cache-Control: public, max-age=300
 *
 * Admin write:
 * - GET/POST   /api/admin/home-content/images/
 * - PATCH      /api/admin/home-content/images/{id}/
 * - POST       /api/admin/home-content/images/upload/
 * - POST       /api/admin/home-content/images/{id}/process/
 * - GET/POST   /api/admin/home-content/collections/
 * - GET/POST   /api/admin/home-content/promotions/
 * - POST       /api/admin/home-content/promotions/{id}/publish/
 * - GET/POST   /api/admin/home-content/hero-campaigns/
 * - GET/POST   /api/admin/home-content/seasonal-packs/
 * - POST       /api/admin/home-content/manifest/publish/
 * - GET        /api/admin/home-content/preview/
 * - POST       /api/admin/home-content/images/reorder/
 *
 * Publishing flow:
 * Admin edits → draft → Publish → manifest_builder writes JSON to CDN →
 * mobile picks up on next manifest fetch (ETag change).
 *
 * Django Admin navigation (Home Content app group):
 * - Dashboard, Image Library, Collections, Promotions, Hero Campaigns,
 *   Seasonal Content, Preview Home, Upload Image, Reorder Images,
 *   Archive, Schedule Publication
 */
export const ADMIN_HOME_CONTENT_IMAGES_PATH = "/admin/home-content/images/";
export const ADMIN_HOME_CONTENT_IMAGE_DETAIL_PATH = (id: string): string =>
  `/admin/home-content/images/${id}/`;
export const ADMIN_HOME_CONTENT_IMAGE_UPLOAD_PATH =
  "/admin/home-content/images/upload/";
export const ADMIN_HOME_CONTENT_IMAGE_PROCESS_PATH = (id: string): string =>
  `/admin/home-content/images/${id}/process/`;
export const ADMIN_HOME_CONTENT_IMAGE_REORDER_PATH =
  "/admin/home-content/images/reorder/";
export const ADMIN_HOME_CONTENT_COLLECTIONS_PATH =
  "/admin/home-content/collections/";
export const ADMIN_HOME_CONTENT_PROMOTIONS_PATH =
  "/admin/home-content/promotions/";
export const ADMIN_HOME_CONTENT_PROMOTION_PUBLISH_PATH = (id: string): string =>
  `/admin/home-content/promotions/${id}/publish/`;
export const ADMIN_HOME_CONTENT_HERO_CAMPAIGNS_PATH =
  "/admin/home-content/hero-campaigns/";
export const ADMIN_HOME_CONTENT_SEASONAL_PACKS_PATH =
  "/admin/home-content/seasonal-packs/";
export const ADMIN_HOME_CONTENT_MANIFEST_PUBLISH_PATH =
  "/admin/home-content/manifest/publish/";
export const ADMIN_HOME_CONTENT_PREVIEW_PATH = "/admin/home-content/preview/";
export const ADMIN_HOME_CONTENT_DASHBOARD_PATH =
  "/admin/home-content/dashboard/";

export const PUBLIC_HOME_CONTENT_MANIFEST_PATH = "/home-content/manifest/";
