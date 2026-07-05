import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
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
 * - Outputs: centered modal overlay with download, optional release notes, and dismiss.
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
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (visible) {
      dialogRef.current?.focus();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Escape") {
      onDismiss();
    }
  };

  return (
    <div className={styles.overlay} data-testid="update-available-banner">
      <button
        type="button"
        className={styles.backdrop}
        aria-label={t("updates.prompt.dismissAria")}
        data-testid="update-available-banner-backdrop"
        onClick={onDismiss}
      />
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-prompt-title"
        aria-describedby="update-prompt-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <AppIcon id="updates.available" decorative size={22} />
          </div>
          <div className={styles.heading}>
            <h2 id="update-prompt-title" className={styles.title}>
              {t("updates.prompt.title")}
            </h2>
            {latestVersion !== undefined ? (
              <span className={styles.versionBadge} data-testid="update-available-banner-version">
                v{latestVersion}
              </span>
            ) : null}
          </div>
        </div>

        <p
          id="update-prompt-description"
          className={styles.description}
          data-testid="update-available-banner-message"
        >
          {t("updates.prompt.description")}
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
    </div>
  );
}
