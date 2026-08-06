import type { JSX } from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import { useI18n } from "../../../i18n/index.js";
import { Alert, AlertTitle } from "../../ui/alert/index.js";
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
 * - Outputs: compact one-line Alert chip for main softphone width (≥360px).
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

  const productLabel =
    mode === "reconnecting"
      ? t("ocp.connection.reconnectingTitle")
      : t("ocp.connection.failedTitle");
  const statusLabel =
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
        <AppIcon id="connection.retry" decorative size={14} preferAnimated={false} />
        <AlertTitle
          className={styles.title}
          data-testid="ocp-connection-banner-message"
        >
          <span className={styles.product}>{productLabel}</span>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <span className={styles.status}>{statusLabel}</span>
        </AlertTitle>
        {mode === "failed" ? (
          <div className={styles.actions}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              fullWidth
              className={styles.retryButton}
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
