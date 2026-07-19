/**
 * - Purpose: resolve capture/popup title snapshot for a notification descriptor.
 * - Inputs: descriptor (text or i18n key + params) and active language.
 * - Outputs: localized title string; never throws on missing interpolation params.
 */

import type { SupportedLanguage } from "@application/index.js";
import type { NotificationDescriptor } from "../../hooks/useNotifications.js";
import { resolveNotificationMessage } from "./resolveNotificationMessage.js";

export function resolveNotificationDescriptorTitle(
  descriptor: NotificationDescriptor,
  language: SupportedLanguage,
): string {
  if (descriptor.messageText !== undefined) {
    return descriptor.messageText;
  }
  if (descriptor.messageKey === undefined) {
    return "";
  }
  return resolveNotificationMessage(
    {
      id: descriptor.id ?? "notification-title",
      level: descriptor.level,
      messageKey: descriptor.messageKey,
      messageText: null,
      messageParams: descriptor.messageParams ?? null,
      durationMs: 0,
      closable: true,
      action: null,
      onClose: null,
    },
    language,
  );
}
