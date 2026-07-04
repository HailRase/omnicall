import type { JSX } from "react";
import clsx from "clsx";
import { useI18n } from "../../i18n/index.js";
import styles from "./TransferSuccessOverlay.module.css";

export type TransferSuccessOverlayProps = Readonly<{
  visible: boolean;
  exiting: boolean;
}>;

/**
 * - Purpose: full-screen transfer success celebration with animated checkmark.
 * - Inputs: visibility and exit-phase flags from celebration hook.
 * - Outputs: centered success overlay; auto-dismiss handled outside the component.
 * @uiMeta lf=LF-028,LF-029 f=F-006,F-007 smoke=transfer-success
 */
export function TransferSuccessOverlay({
  visible,
  exiting,
}: TransferSuccessOverlayProps): JSX.Element | null {
  const { t } = useI18n();
  if (!visible) {
    return null;
  }

  return (
    <section
      className={clsx(styles.overlay, exiting && styles.overlayExiting)}
      data-testid="transfer-success-overlay"
      role="status"
      aria-live="polite"
      aria-label={t("transfer.success.message")}
    >
      <div className={styles.content}>
        <div className={styles.iconRing} aria-hidden="true">
          <svg className={styles.checkmark} viewBox="0 0 48 48">
            <path
              className={styles.checkmarkPath}
              d="M12 24.5 L20.5 33 L36 16"
            />
          </svg>
        </div>
        <p className={styles.message}>{t("transfer.success.message")}</p>
      </div>
    </section>
  );
}
