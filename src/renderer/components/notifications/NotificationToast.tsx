import clsx from "clsx";
import type { JSX } from "react";
import { I18N_MESSAGES, useI18n } from "../../i18n/index.js";
import { IconControlButton } from "../icons/index.js";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import styles from "./NotificationToast.module.css";

export type NotificationToastProps = Readonly<{
  item: NotificationItem;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
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

/**
 * - Purpose: render one accessible notification toast with optional action.
 * - Inputs: queue item and toast lifecycle callbacks.
 * - Outputs: themed toast card with severity semantics and controls.
 */
export function NotificationToast({
  item,
  onDismiss,
  onPause,
  onResume,
}: NotificationToastProps): JSX.Element {
  const { t, language } = useI18n();
  const message = resolveMessage(item, language);
  const isError = item.level === "error";

  return (
    <article
      className={clsx(
        styles.toast,
        item.level === "success" && styles.toastSuccess,
        item.level === "warning" && styles.toastWarning,
        item.level === "error" && styles.toastError,
      )}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      data-testid="notification-toast"
      onMouseEnter={() => {
        onPause(item.id);
      }}
      onMouseLeave={() => {
        onResume(item.id);
      }}
      onFocusCapture={() => {
        onPause(item.id);
      }}
      onBlurCapture={() => {
        onResume(item.id);
      }}
    >
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {item.action !== null ? (
          <button
            type="button"
            className={styles.actionButton}
            data-testid={`notification-action-${item.action.id}`}
            onClick={() => {
              item.action?.onClick();
            }}
          >
            {t(item.action.labelKey)}
          </button>
        ) : null}
        {item.closable ? (
          <IconControlButton
            iconId="overlay.close"
            ariaLabel={t("icons.overlay.close")}
            tooltipLabel={t("icons.overlay.close")}
            className={styles.dismiss}
            testId={`notification-dismiss-${item.id}`}
            onClick={() => {
              item.onClose?.();
              onDismiss(item.id);
            }}
          />
        ) : null}
      </div>
    </article>
  );
}
