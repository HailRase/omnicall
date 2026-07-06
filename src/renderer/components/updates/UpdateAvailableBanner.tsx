import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./UpdateAvailableBanner.module.css";

export type UpdateAvailableBannerProps = Readonly<{
  visible: boolean;
  latestVersion: string | undefined;
  onDownload: () => void;
  onDismiss: () => void;
}>;

/**
 * - Purpose: non-blocking top update prompt for manual download (F-020).
 * - Inputs: visibility flag, latest version, and action callbacks.
 * - Outputs: floating overlay card with download and later actions.
 */
export function UpdateAvailableBanner({
  visible,
  latestVersion,
  onDownload,
  onDismiss,
}: UpdateAvailableBannerProps): JSX.Element | null {
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

  return (
    <div
      className={styles.anchor}
      role="status"
      aria-live="polite"
      aria-label={t("updates.prompt.ariaLabel")}
    >
      <article className={styles.card} data-testid="update-available-banner">
        <div className={styles.lead}>
          <div className={styles.iconWrap} aria-hidden="true">
            <AppIcon id="updates.available" decorative size={20} />
          </div>
          <div className={styles.content}>
            <p className={styles.title}>{t("updates.prompt.title")}</p>
            <p className={styles.message} data-testid="update-available-banner-message">
              {t("updates.prompt.message", { latestVersion })}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            data-testid="update-available-banner-download"
            onClick={onDownload}
          >
            <AppIcon id="updates.available" decorative size={16} preferAnimated={false} />
            <span>{t("updates.prompt.download")}</span>
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            data-testid="update-available-banner-later"
            onClick={onDismiss}
          >
            <AppIcon id="overlay.close" decorative size={16} preferAnimated={false} />
            <span>{t("updates.prompt.later")}</span>
          </button>
        </div>
      </article>
    </div>
  );
}
