import type { JSX } from "react";
import { I18N_MESSAGES, useI18n } from "../../i18n/index.js";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import {
  ToastAction,
  ToastClose,
  ToastRoot,
  ToastTitle,
} from "../ui/toast/index.js";
import { notificationLevelToToastTone } from "./notificationLevelToToastTone.js";

export type NotificationToastProps = Readonly<{
  item: NotificationItem;
  onDismiss: (id: string) => void;
}>;

function resolveMessage(item: NotificationItem, language: ReturnType<typeof useI18n>["language"]): string {
  if (item.messageText !== null) {
    return item.messageText;
  }
  if (item.messageKey === null) {
    return "";
  }
  const entry = I18N_MESSAGES[language][item.messageKey];
  if (typeof entry === "function") {
    const params = item.messageParams ?? {};
    const formatter = entry as (params: Readonly<Record<string, string | number | undefined>>) => string;
    return formatter(params);
  }
  return entry;
}

function resolveToastDuration(durationMs: number): number {
  return durationMs > 0 ? durationMs : Number.POSITIVE_INFINITY;
}

/**
 * - Purpose: render one product notification through UI Kit toast primitives.
 * - Inputs: queue item and dismiss callback.
 * - Outputs: accessible toast with tone, optional action, and optional close control.
 */
export function NotificationToast({ item, onDismiss }: NotificationToastProps): JSX.Element {
  const { t, language } = useI18n();
  const message = resolveMessage(item, language);
  const actionLabel = item.action !== null ? t(item.action.labelKey) : null;

  return (
    <ToastRoot
      open
      tone={notificationLevelToToastTone(item.level)}
      duration={resolveToastDuration(item.durationMs)}
      data-testid="notification-toast"
      onOpenChange={(open) => {
        if (!open) {
          item.onClose?.();
          onDismiss(item.id);
        }
      }}
    >
      <ToastTitle>{message}</ToastTitle>
      {item.action !== null && actionLabel !== null ? (
        <ToastAction
          altText={actionLabel}
          data-testid={`notification-action-${item.action.id}`}
          onClick={() => {
            item.action?.onClick();
          }}
        >
          {actionLabel}
        </ToastAction>
      ) : null}
      {item.closable ? (
        <ToastClose
          closeLabel={t("icons.overlay.close")}
          data-testid={`notification-dismiss-${item.id}`}
        />
      ) : null}
    </ToastRoot>
  );
}
