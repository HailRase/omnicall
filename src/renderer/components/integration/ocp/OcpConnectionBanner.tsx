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
 * - Purpose: global OCP reconnect/failed banner (shell overlay layer).
 * - Inputs: visibility, mode, attempt counters, retry callback.
 * - Outputs: compact two-line Alert that fits the main softphone width.
 * - Note: sole user surface for unexpected-drop auto-recovery (`uiSurface: silent`).
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

  // Primary line = status (must wrap fully on ~360px). Secondary = product label.
  const title =
    mode === "reconnecting"
      ? t("ocp.connection.reconnecting", {
          attempt: reconnectAttempt,
          max: maxReconnectAttempts,
        })
      : t("ocp.connection.failed");
  const subtitle =
    mode === "reconnecting"
      ? t("ocp.connection.reconnectingTitle")
      : t("ocp.connection.failedTitle");

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
        <AppIcon id="connection.retry" decorative size={14} preferAnimated={false} />
        <AlertTitle
          className={styles.title}
          data-testid="ocp-connection-banner-message"
        >
          {title}
        </AlertTitle>
        <AlertDescription className={styles.message}>{subtitle}</AlertDescription>
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
