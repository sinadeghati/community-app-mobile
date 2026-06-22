import type { AppLocale } from "./resources";
import { DEFAULT_LOCALE, translations } from "./resources";

type InterpolationValues = Record<string, string | number>;

const getNestedValue = (
  source: Record<string, unknown>,
  keyPath: string
): unknown => {
  return keyPath.split(".").reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
};

const applyInterpolation = (template: string, values?: InterpolationValues) => {
  if (!values) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = values[token];
    return value == null ? "" : String(value);
  });
};

export const createTranslator = (locale: AppLocale) => {
  const catalog = translations[locale] ?? translations[DEFAULT_LOCALE];

  return (key: string, values?: InterpolationValues): string => {
    const raw = getNestedValue(catalog, key);
    if (typeof raw === "string") {
      return applyInterpolation(raw, values);
    }

    const fallback = getNestedValue(translations[DEFAULT_LOCALE], key);
    if (typeof fallback === "string") {
      return applyInterpolation(fallback, values);
    }

    return key;
  };
};

export const collectTranslationKeys = (
  source: Record<string, unknown>,
  prefix = ""
): string[] => {
  const keys: string[] = [];

  Object.entries(source).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectTranslationKeys(value as Record<string, unknown>, path));
      return;
    }
    keys.push(path);
  });

  return keys;
};

export const getMissingTranslationKeys = (
  baseLocale: AppLocale,
  targetLocale: AppLocale
): string[] => {
  const baseKeys = new Set(
    collectTranslationKeys(translations[baseLocale] as Record<string, unknown>)
  );
  const targetKeys = new Set(
    collectTranslationKeys(translations[targetLocale] as Record<string, unknown>)
  );

  return [...baseKeys].filter((key) => !targetKeys.has(key)).sort();
};

export const getExtraTranslationKeys = (
  baseLocale: AppLocale,
  targetLocale: AppLocale
): string[] => {
  const baseKeys = new Set(
    collectTranslationKeys(translations[baseLocale] as Record<string, unknown>)
  );
  const targetKeys = collectTranslationKeys(
    translations[targetLocale] as Record<string, unknown>
  );

  return targetKeys.filter((key) => !baseKeys.has(key)).sort();
};
