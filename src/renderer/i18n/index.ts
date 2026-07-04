export type {
  TranslationCatalog,
  TranslationKey,
  TranslationParams,
} from "./messages.js";
export { I18N_MESSAGES } from "./messages.js";
export {
  getRendererLanguage,
  setRendererLanguage,
  translateCurrent,
  translateInLanguage,
  useI18n,
  type Translator,
} from "./runtime.js";
