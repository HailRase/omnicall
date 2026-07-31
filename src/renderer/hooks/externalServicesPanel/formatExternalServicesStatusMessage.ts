/**
 * - Purpose: format External Services shell status keys for dialog chrome.
 * - Inputs: translation key and optional interpolation params.
 * - Outputs: localized status string.
 */

import { translateCurrent, type TranslationKey } from "../../i18n/index.js";

export function formatExternalServicesStatusMessage(
  key: TranslationKey,
  params: Readonly<Record<string, string>> | null,
): string {
  if (key === "settings.integrations.externalServices.importExport.importSucceeded") {
    return translateCurrent(key, { name: params?.["name"] ?? "" });
  }
  if (key === "settings.integrations.externalServices.importExport.exportSucceeded") {
    return translateCurrent(key, { fileName: params?.["fileName"] ?? "" });
  }
  return translateCurrent(key);
}
