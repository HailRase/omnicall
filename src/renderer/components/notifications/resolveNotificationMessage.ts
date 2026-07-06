import type { SupportedLanguage } from "@application/index.js";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { I18N_MESSAGES } from "../../i18n/index.js";

/**
 * - Purpose: resolve localized notification copy for Sonner toast rendering.
 * - Inputs: queue item and active renderer language.
 * - Outputs: user-visible toast message string.
 */
export function resolveNotificationMessage(
  item: NotificationItem,
  language: SupportedLanguage,
): string {
  if (item.messageText !== null) {
    return item.messageText;
  }

  if (item.messageKey === null) {
    return "";
  }

  const entry = I18N_MESSAGES[language][item.messageKey];
  if (typeof entry === "function") {
    const params = item.messageParams ?? {};
    const formatter = entry as (
      params: Readonly<Record<string, string | number | undefined>>,
    ) => string;
    return formatter(params);
  }

  return entry;
}
