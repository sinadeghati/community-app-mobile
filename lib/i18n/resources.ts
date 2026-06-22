import en from "../../locales/en.json";
import fa from "../../locales/fa.json";

export type AppLocale = "en" | "fa";

export const SUPPORTED_LOCALES: AppLocale[] = ["en", "fa"];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fa: "فارسی",
};

export const translations: Record<AppLocale, Record<string, unknown>> = {
  en,
  fa,
};

export const DEFAULT_LOCALE: AppLocale = "en";

export const normalizeStoredLocale = (value?: string | null): AppLocale => {
  if (value === "fa" || value === "fa-preview") return "fa";
  return "en";
};

export const isRtlLocale = (locale: AppLocale) => locale === "fa";
