/**
 * - Purpose: route External Services mutation outcomes to toast or FormField strip.
 * - Inputs: message key, optional notify, inline error setter.
 * - Outputs: toast for ephemeral save/busy; inline key for validation.*.
 */

import type { TranslationKey } from "../../i18n/messages.js";
import type { NotificationDescriptor } from "../useNotifications.js";

export function presentExternalServicesOutcomeError(input: Readonly<{
  messageKey: TranslationKey;
  notify?: (descriptor: NotificationDescriptor) => void;
  setInlineErrorKey: (key: TranslationKey | null) => void;
  functionId?: string;
}>): void {
  if (input.messageKey.includes(".validation.")) {
    input.setInlineErrorKey(input.messageKey);
    return;
  }
  input.notify?.({
    level: "error",
    messageKey: input.messageKey,
    module: "externalServices",
    functionId: input.functionId ?? "external_services.request.mutate",
    interruptClass: "actionable",
  });
  input.setInlineErrorKey(null);
}
