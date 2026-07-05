import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./UpdateAvailableBanner.module.css";

export type UpdateAvailableBannerProps = Readonly<{
  visible: boolean;
  latestVersion: string | undefined;
  canOpenReleaseNotes: boolean;
  onDownload: () => void;
  onReleaseNotes: () => void;
  onDismiss: () => void;
}>;

/**
 * - Purpose: non-blocking startup update prompt for manual download (F-020).
 * - Inputs: visibility flag, latest version, and action callbacks.
 * - Outputs: accessible banner with download, optional release notes, and dismiss.
 */
export function UpdateAvailableBanner({
  visible,
  latestVersion,
  canOpenReleaseNotes,
  onDownload,
  onReleaseNotes,
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
        {canOpenReleaseNotes ? (
          <button
            type="button"
            className={styles.secondaryButton}
            data-testid="update-available-banner-release-notes"
            onClick={onReleaseNotes}
          >
            {t("updates.prompt.releaseNotes")}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.secondaryButton}
          data-testid="update-available-banner-later"
          onClick={onDismiss}
        >
          {t("updates.prompt.later")}
        </button>
      </div>
      <IconControlButton
        iconId="overlay.close"
        ariaLabel={t("updates.prompt.dismissAria")}
        tooltipLabel={t("updates.prompt.later")}
        className={styles.dismiss}
        testId="update-available-banner-dismiss"
        onClick={onDismiss}
      />
    </section>
  );
}
