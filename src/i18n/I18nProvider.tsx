import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Language,
  TranslationDictionary,
  TranslationValue,
  translations,
} from "./translations";

const LOCAL_STORAGE_KEY = "tfi-language";
const FALLBACK_LANGUAGE: Language = "es";

export const SUPPORTED_LANGUAGES = Object.keys(translations) as Language[];

interface TranslationParams {
  [key: string]: string | number;
}

interface I18nContextValue {
  language: Language;
  languages: Language[];
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getNestedValue = (
  dictionary: TranslationDictionary,
  key: string
): TranslationValue | undefined => {
  return key.split(".").reduce<TranslationValue | undefined>((acc, part) => {
    if (acc === undefined) {
      return undefined;
    }

    if (typeof acc === "string") {
      return undefined;
    }

    return acc[part];
  }, dictionary);
};

const formatTranslation = (
  template: string,
  params?: TranslationParams
): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, token) => {
    const key = token.trim();
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      return value !== undefined && value !== null ? String(value) : "";
    }
    return "";
  });
};

const translate = (
  language: Language,
  key: string,
  params?: TranslationParams
): string => {
  const dictionary = translations[language] ?? translations[FALLBACK_LANGUAGE];
  const fallbackDictionary = translations[FALLBACK_LANGUAGE];

  const rawValue =
    getNestedValue(dictionary, key) ?? getNestedValue(fallbackDictionary, key);

  if (typeof rawValue !== "string") {
    return key;
  }

  return formatTranslation(rawValue, params);
};

const resolveInitialLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(
      LOCAL_STORAGE_KEY
    ) as Language | null;

    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }

    const navigatorLanguage = window.navigator.language.slice(0, 2) as Language;
    if (SUPPORTED_LANGUAGES.includes(navigatorLanguage)) {
      return navigatorLanguage;
    }
  }

  return FALLBACK_LANGUAGE;
};

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (initialLanguage && SUPPORTED_LANGUAGES.includes(initialLanguage)) {
      return initialLanguage;
    }
    return resolveInitialLanguage();
  });

  const setLanguage = useCallback((nextLanguage: Language) => {
    const available = SUPPORTED_LANGUAGES.includes(nextLanguage)
      ? nextLanguage
      : FALLBACK_LANGUAGE;

    setLanguageState(available);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, available);
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t: (key: string, params?: TranslationParams) =>
        translate(language, key, params),
    }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider.");
  }
  return context;
};
