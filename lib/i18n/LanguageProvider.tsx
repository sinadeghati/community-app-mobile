import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { I18nManager, View } from "react-native";
import {
  loadUserSettings,
  saveUserSettings,
} from "../../app/profile/settingsStorage";
import { createTranslator } from "./translate";
import {
  DEFAULT_LOCALE,
  isRtlLocale,
  normalizeStoredLocale,
  type AppLocale,
} from "./resources";
import { theme } from "../theme";

type InterpolationValues = Record<string, string | number>;

type LanguageContextValue = {
  locale: AppLocale;
  isRTL: boolean;
  ready: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (key: string, values?: InterpolationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Persian MVP: keep physical LTR layout; isRTL is for text alignment only. */
const ensureLtrLayout = () => {
  if (
    I18nManager.isRTL ||
    I18nManager.swapLeftAndRightInRTL
  ) {
    I18nManager.allowRTL(false);
    I18nManager.swapLeftAndRightInRTL(false);
    I18nManager.forceRTL(false);
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const settings = await loadUserSettings();
      const nextLocale = normalizeStoredLocale(settings.language);
      ensureLtrLayout();
      setLocaleState(nextLocale);
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (nextLocale: AppLocale) => {
    ensureLtrLayout();
    setLocaleState(nextLocale);
    await saveUserSettings({ language: nextLocale });
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = createTranslator(locale);
    return {
      locale,
      isRTL: isRtlLocale(locale),
      ready,
      setLocale,
      t,
    };
  }, [locale, ready, setLocale]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
        {children}
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      <View style={{ flex: 1 }}>{children}</View>
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
};
