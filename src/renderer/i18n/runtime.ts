import { useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  type SupportedLanguage,
} from "@application/index.js";
import {
  I18N_MESSAGES,
  type TranslationCatalog,
  type TranslationKey,
  type TranslationParams,
} from "./messages.js";

let currentLanguage: SupportedLanguage = DEFAULT_SUPPORTED_LANGUAGE;
const listeners = new Set<() => void>();

const LOCALE_BY_LANGUAGE: Readonly<Record<SupportedLanguage, string>> = {
  ru: "ru-RU",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
};

export type Translator = <K extends TranslationKey>(
  key: K,
  ...params: TranslationCatalog[K] extends (params: infer T) => string ? [T] : []
) => string;

/**
 * - Purpose: provide typed renderer translation runtime with live locale switch.
 * - Inputs: translation key and optional interpolation params.
 * - Outputs: localized UI string for current language.
 */
export function translateInLanguage<K extends TranslationKey>(
  language: SupportedLanguage,
  key: K,
  ...params: TranslationCatalog[K] extends (params: infer T) => string ? [T] : []
): string {
  const entry = I18N_MESSAGES[language][key];
  if (typeof entry === "function") {
    const formatter = entry as (params: TranslationParams<K>) => string;
    const [param] = params as [TranslationParams<K>];
    return formatter(param);
  }
  return entry;
}

export function translateCurrent<K extends TranslationKey>(
  key: K,
  ...params: TranslationCatalog[K] extends (params: infer T) => string ? [T] : []
): string {
  return translateInLanguage(currentLanguage, key, ...params);
}

export function setRendererLanguage(language: SupportedLanguage): void {
  if (currentLanguage === language) {
    return;
  }
  currentLanguage = language;
  listeners.forEach((listener) => {
    listener();
  });
}

export function getRendererLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * - Purpose: format ISO timestamps for settings journal rows per UI language.
 * - Inputs: ISO timestamp string and supported language code.
 * - Outputs: locale-aware date-time label or original string when invalid.
 */
export function formatLocaleDateTime(iso: string, language: SupportedLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(LOCALE_BY_LANGUAGE[language], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function useI18n(): Readonly<{
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: Translator;
}> {
  const language = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => currentLanguage,
    () => currentLanguage,
  );

  const t = useMemo<Translator>(() => {
    return (key, ...params) => translateInLanguage(language, key, ...params);
  }, [language]);

  return {
    language,
    setLanguage: setRendererLanguage,
    t,
  };
}
