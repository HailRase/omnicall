import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import styles from "./UpdateAvailableBanner.module.css";

export type UpdateAvailableBannerProps = Readonly<{
  visible: boolean;
  latestVersion: string | undefined;
  onDownload: () => void;
  onDismiss: () => void;
}>;

/**
 * - Purpose: compact top update prompt for manual download (F-020).
 * - Inputs: visibility flag, latest version, and action callbacks.
 * - Outputs: accessible single-row banner with download and later actions.
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
    <section
      className={styles.banner}
      role="status"
      aria-live="polite"
      aria-label={t("updates.prompt.ariaLabel")}
      data-testid="update-available-banner"
    >
      <p className={styles.message} data-testid="update-available-banner-message">
        {t("updates.prompt.message", { latestVersion })}
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          data-testid="update-available-banner-download"
          onClick={onDownload}
        >
          {t("updates.prompt.download")}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          data-testid="update-available-banner-later"
          onClick={onDismiss}
        >
          {t("updates.prompt.later")}
        </button>
      </div>
    </section>
  );
}
