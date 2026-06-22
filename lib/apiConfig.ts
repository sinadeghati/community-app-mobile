/**
 * API environment configuration.
 *
 * Environments:
 * - development — Cursor / experiments → STAGING backend
 * - staging       — QA device testing     → STAGING backend
 * - production    — store / live users only → PRODUCTION backend
 *
 * See docs/RAILWAY_ARCHITECTURE.md and docs/RAILWAY_ENV_VARS.md
 *
 * Override order:
 * 1. EXPO_PUBLIC_API_BASE_URL
 * 2. EXPO_PUBLIC_API_ENV=development|staging|production
 * 3. production (when unset — prefer npm scripts)
 */
export type ApiEnvironment = "development" | "staging" | "production";

const STAGING_API_BASE = "https://community-app-backend-staging.up.railway.app/api";
const PRODUCTION_API_BASE = "https://api.korook.com/api";

const API_URLS: Record<ApiEnvironment, string> = {
  development: STAGING_API_BASE,
  staging: STAGING_API_BASE,
  production: PRODUCTION_API_BASE,
};

export const getApiEnvironment = (): ApiEnvironment => {
  const env = process.env.EXPO_PUBLIC_API_ENV?.trim().toLowerCase();
  if (env === "development" || env === "dev") {
    return "development";
  }
  if (env === "staging") {
    return "staging";
  }
  if (env === "production" || env === "prod") {
    return "production";
  }
  return "production";
};

export const getApiBaseUrl = (): string => {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return API_URLS[getApiEnvironment()];
};

/** True when running a non-production API environment */
export const isNonProductionApi = (): boolean =>
  getApiEnvironment() !== "production";

/** Resolved at bundle load — restart Expo after changing .env */
export const API_BASE_URL = getApiBaseUrl();

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
