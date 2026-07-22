import { useEffect, useRef, useState, type JSX } from "react";
import type {
  AuthorizationProgressProjection,
  OcpSignInExecutionStage,
} from "@application/projections/settings/authorizationProgressProjection.js";
import {
  deriveOcpSignInProgressView,
  type OcpSignInStageVisualState,
} from "@application/projections/settings/deriveOcpSignInProgressView.js";
import {
  formatOcpSignInFailureTooltip,
  mapOcpSignInFailureToMessageKey,
} from "../../integration/ocp/mapOcpSignInFailureToMessageKey.js";
import { useI18n } from "../../i18n/index.js";
import type { TranslationKey } from "../../i18n/messages.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  type ProgressTone,
} from "../ui/index.js";
import styles from "./OcpSignInProgress.module.css";
import { OcpSignInProgressStatusIcon } from "./OcpSignInProgressStatusIcon.js";

const STAGE_KEY: Record<OcpSignInExecutionStage, TranslationKey> = {
  requesting_authorization_token: "account.authProgress.stage.httpToken",
  submitting_token_to_ocp: "account.authProgress.stage.submitToken",
  awaiting_authorization_data: "account.authProgress.stage.awaitData",
  connecting_sip_transport: "account.authProgress.stage.sipTransport",
  authorizing_sip: "account.authProgress.stage.sipAuthorization",
};

const TICK_MS = 50;
const SUCCESS_CLOSE_MS = 900;

export type OcpSignInProgressDensity = "comfortable" | "compact";

type OcpSignInProgressProps = Readonly<{
  open: boolean;
  progress: AuthorizationProgressProjection;
  reconnectEnabled: boolean;
  busy?: boolean;
  /** Shell window density: settings (comfortable) vs dialpad/side panels (compact). */
  density?: OcpSignInProgressDensity;
  onDisconnect: () => void;
  onReconnect: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccessSettled?: () => void;
}>;

function resolveTone(
  state: OcpSignInStageVisualState | "idle" | "active" | "completed" | "failed",
): ProgressTone {
  if (state === "failed") {
    return "destructive";
  }
  if (state === "completed") {
    return "success";
  }
  return "default";
}

function resolveStatusTextKey(state: OcpSignInStageVisualState): TranslationKey {
  if (state === "failed") {
    return "account.authProgress.status.failed";
  }
  if (state === "completed") {
    return "account.authProgress.status.completed";
  }
  if (state === "active") {
    return "account.authProgress.status.active";
  }
  return "account.authProgress.status.pending";
}

/**
 * - Purpose: global shell modal for OCP sign-in progress (settings + main + routes).
 * - Inputs: live authorization progress projection + disconnect/reconnect callbacks.
 * - Outputs: accessible Dialog; no Facade/SIP ownership.
 */
export function OcpSignInProgress({
  open,
  progress,
  reconnectEnabled,
  busy = false,
  density = "comfortable",
  onDisconnect,
  onReconnect,
  onOpenChange,
  onSuccessSettled,
}: OcpSignInProgressProps): JSX.Element {
  const { t } = useI18n();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [liveStatus, setLiveStatus] = useState("");
  const view = deriveOcpSignInProgressView(progress, nowMs);
  const shouldTick =
    open && (view.overallState === "active" || view.hasLatentFailure);
  const lastAnnouncedRef = useRef<string>("");
  const activeStage = view.stages.find((stage) => stage.state === "active");
  const failedStage = view.stages.find((stage) => stage.state === "failed");

  // Reset wall-clock when attempt/stage ownership changes so a new run never
  // inherits a stale percent from the previous attempt.
  useEffect(() => {
    setNowMs(Date.now());
  }, [progress.correlationId, progress.executionStage, progress.stageStartedAtMs]);

  useEffect(() => {
    if (!shouldTick) {
      return;
    }
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [shouldTick, progress.executionStage, progress.stageStartedAtMs]);

  useEffect(() => {
    if (!open || !view.isReady || view.hasFailure || view.hasLatentFailure) {
      return;
    }
    const timer = window.setTimeout(() => {
      onSuccessSettled?.();
    }, SUCCESS_CLOSE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open, view.hasFailure, view.hasLatentFailure, view.isReady, onSuccessSettled]);

  // Announce only semantic stage/state changes — never 50ms percent ticks.
  useEffect(() => {
    if (!open) {
      lastAnnouncedRef.current = "";
      setLiveStatus("");
      return;
    }
    let next = "";
    if (view.isReady && !view.hasFailure) {
      next = t("account.authProgress.status.completed");
    } else if (failedStage !== undefined) {
      next = `${t(STAGE_KEY[failedStage.stage])}: ${t("account.authProgress.status.failed")}`;
    } else if (activeStage !== undefined) {
      next = `${t(STAGE_KEY[activeStage.stage])}: ${t("account.authProgress.status.active")}`;
    }
    if (next.length > 0 && next !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = next;
      setLiveStatus(next);
    }
  }, [activeStage, failedStage, open, t, view.hasFailure, view.isReady]);

  const reconnectDisabled = busy || !reconnectEnabled || !view.hasFailure;
  const reconnectDisabledReason = reconnectDisabled
    ? busy
      ? t("account.authProgress.reconnectDisabled.busy")
      : !view.hasFailure
        ? t("account.authProgress.reconnectDisabled.inProgress")
        : t("account.authProgress.reconnectDisabled.unavailable")
    : null;

  const reconnectButton = (
    <Button
      type="button"
      variant="primary"
      size="sm"
      disabled={reconnectDisabled}
      data-testid="account-ocp-progress-reconnect"
      onClick={onReconnect}
    >
      {t("account.authProgress.reconnect")}
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDisconnect();
        }
        onOpenChange?.(nextOpen);
      }}
    >
      <DialogContent
        size={density === "compact" ? "sm" : "md"}
        className={styles.content}
        overlayClassName={styles.overlayBlur}
        closeLabel={t("account.authProgress.disconnect")}
        showCloseButton={false}
        data-density={density}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          onDisconnect();
        }}
        data-testid="account-ocp-progress-modal"
      >
        <DialogHeader className={styles.header}>
          <DialogTitle className={styles.title}>
            {t("account.authProgress.modalTitle")}
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {t("account.authProgress.modalDescription")}
          </DialogDescription>
        </DialogHeader>

        <div
          className={styles.liveRegion}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="account-ocp-progress-live-status"
        >
          {liveStatus}
        </div>

        <ol className={styles.list} aria-label={t("account.authProgress.stagesAria")}>
          {view.stages.map((stageView) => {
            const failureLabel =
              stageView.state === "failed"
                ? formatOcpSignInFailureTooltip(
                    t(
                      mapOcpSignInFailureToMessageKey(
                        stageView.failureKind,
                        stageView.failureCode,
                      ),
                    ),
                    stageView.failureCode,
                  )
                : null;

            return (
              <li
                key={stageView.stage}
                className={styles.item}
                data-state={stageView.state}
                data-testid={`account-ocp-progress-stage-${stageView.stage}`}
              >
                <div className={styles.main}>
                  <span className={styles.label}>{t(STAGE_KEY[stageView.stage])}</span>
                  <Progress
                    className={styles.stageBar}
                    value={stageView.percent}
                    tone={resolveTone(stageView.state)}
                    aria-label={t(STAGE_KEY[stageView.stage])}
                  />
                </div>
                <div
                  className={styles.status}
                  data-compact-icons={density === "compact" ? "true" : undefined}
                >
                  <OcpSignInProgressStatusIcon
                    state={stageView.state}
                    failureLabel={failureLabel}
                    statusLabel={t(resolveStatusTextKey(stageView.state))}
                    iconsOnly={density === "compact"}
                  />
                  {density === "compact" ? null : (
                    <span className={styles.statusText}>
                      {t(resolveStatusTextKey(stageView.state))}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <DialogFooter className={styles.footer}>
          <Button
            type="button"
            variant={view.hasFailure ? "destructive" : "outline"}
            size="sm"
            disabled={busy}
            data-testid="account-ocp-progress-disconnect"
            onClick={onDisconnect}
          >
            {t("account.authProgress.disconnect")}
          </Button>
          {reconnectDisabledReason !== null ? (
            <IconTooltip label={reconnectDisabledReason}>
              <span className={styles.disabledTooltipHost}>{reconnectButton}</span>
            </IconTooltip>
          ) : (
            reconnectButton
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
