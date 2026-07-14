import type { JSX } from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import { useI18n } from "../../../i18n/index.js";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert/index.js";
import { Button } from "../../ui/button/index.js";
import styles from "./OcpConnectionBanner.module.css";

export type OcpConnectionBannerProps = Readonly<{
  visible: boolean;
  mode: "reconnecting" | "failed";
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  onRetry: () => void;
}>;

/**
 * - Purpose: non-blocking OCP reconnect/failed banner under shell chrome.
 * - Inputs: visibility, mode, attempt counters, retry callback.
 * - Outputs: Alert with localized copy and optional Retry control.
 */
export function OcpConnectionBanner({
  visible,
  mode,
  reconnectAttempt,
  maxReconnectAttempts,
  onRetry,
}: OcpConnectionBannerProps): JSX.Element | null {
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

  const title =
    mode === "reconnecting"
      ? t("ocp.connection.reconnectingTitle")
      : t("ocp.connection.failedTitle");
  const message =
    mode === "reconnecting"
      ? t("ocp.connection.reconnecting", {
          attempt: reconnectAttempt,
          max: maxReconnectAttempts,
        })
      : t("ocp.connection.failed");

  return (
    <div
      className={styles.anchor}
      data-testid="ocp-connection-banner-anchor"
      aria-live="polite"
    >
      <Alert
        className={styles.alert}
        variant={mode === "failed" ? "destructive" : "default"}
        data-testid="ocp-connection-banner"
        data-mode={mode}
      >
        <AppIcon id="connection.retry" decorative size={16} preferAnimated={false} />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription data-testid="ocp-connection-banner-message">
          {message}
        </AlertDescription>
        {mode === "failed" ? (
          <div className={styles.actions}>
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-testid="ocp-retry-connect"
              onClick={onRetry}
            >
              {t("ocp.connection.retry")}
            </Button>
          </div>
        ) : null}
      </Alert>
    </div>
  );
}
