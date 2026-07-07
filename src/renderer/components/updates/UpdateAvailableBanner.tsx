import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert/index.js";
import { Button } from "../ui/button/index.js";
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
 * - Outputs: floating Alert overlay with download and later actions.
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
      aria-live="polite"
      aria-label={t("updates.prompt.ariaLabel")}
    >
      <Alert className={styles.alert} data-testid="update-available-banner">
        <AppIcon id="updates.available" decorative size={16} />
        <AlertTitle>{t("updates.prompt.title")}</AlertTitle>
        <AlertDescription data-testid="update-available-banner-message">
          {t("updates.prompt.message", { latestVersion })}
        </AlertDescription>
        <div className={styles.actions}>
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="update-available-banner-download"
            onClick={onDownload}
          >
            <AppIcon id="updates.available" decorative size={16} preferAnimated={false} />
            {t("updates.prompt.download")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="update-available-banner-later"
            onClick={onDismiss}
          >
            <AppIcon id="overlay.close" decorative size={16} preferAnimated={false} />
            {t("updates.prompt.later")}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
