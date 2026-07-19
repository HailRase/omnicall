import { useEffect, useState, type JSX } from "react";
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
import { AppIcon } from "../icons/AppIcon.js";
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

const STAGE_KEY: Record<OcpSignInExecutionStage, TranslationKey> = {
  requesting_authorization_token: "account.authProgress.stage.httpToken",
  submitting_token_to_ocp: "account.authProgress.stage.submitToken",
  awaiting_authorization_data: "account.authProgress.stage.awaitData",
  connecting_sip_transport: "account.authProgress.stage.sipTransport",
  authorizing_sip: "account.authProgress.stage.sipAuthorization",
};

const TICK_MS = 50;
const SUCCESS_CLOSE_MS = 900;

type OcpSignInProgressProps = Readonly<{
  open: boolean;
  progress: AuthorizationProgressProjection;
  reconnectEnabled: boolean;
  busy?: boolean;
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

function StageStatusIcon({
  state,
  failureLabel,
}: Readonly<{
  state: OcpSignInStageVisualState;
  failureLabel: string | null;
}>): JSX.Element {
  if (state === "completed") {
    return (
      <span className={styles.statusIcon} data-state="completed" aria-hidden="true">
        <AppIcon id="notification.success" size={14} decorative />
      </span>
    );
  }
  if (state === "failed" && failureLabel !== null) {
    return (
      <IconTooltip label={failureLabel}>
        <button
          type="button"
          className={styles.statusIcon}
          data-state="failed"
          aria-label={failureLabel}
          data-testid="account-ocp-progress-failure-icon"
        >
          <AppIcon id="notification.error" size={14} decorative />
        </button>
      </IconTooltip>
    );
  }
  return (
    <span
      className={styles.statusIcon}
      data-state={state}
      aria-hidden="true"
      data-testid={state === "active" ? "account-ocp-progress-active-icon" : undefined}
    />
  );
}

/**
 * - Purpose: modal OCP sign-in progress with timed stage bars and recovery footer.
 * - Inputs: live authorization progress projection + disconnect/reconnect callbacks.
 * - Outputs: accessible Dialog; no Facade/SIP ownership.
 */
export function OcpSignInProgress({
  open,
  progress,
  reconnectEnabled,
  busy = false,
  onDisconnect,
  onReconnect,
  onOpenChange,
  onSuccessSettled,
}: OcpSignInProgressProps): JSX.Element {
  const { t } = useI18n();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const view = deriveOcpSignInProgressView(progress, nowMs);
  const shouldTick =
    open && (view.overallState === "active" || view.hasLatentFailure);

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
        size="sm"
        className={styles.content}
        overlayClassName={styles.overlayBlur}
        closeLabel={t("account.authProgress.disconnect")}
        showCloseButton={false}
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

        <section className={styles.overall} aria-label={t("account.authProgress.overallAria")}>
          <p className={styles.overallLabel}>{t("account.authProgress.overallLabel")}</p>
          <Progress
            className={styles.overallBar}
            value={view.overallPercent}
            tone={resolveTone(view.overallState)}
            data-testid="account-ocp-progress-overall"
            aria-label={t("account.authProgress.overallAria")}
          />
        </section>

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
            const statusText =
              stageView.state === "failed"
                ? t(
                    stageView.failureKind === "timeout"
                      ? "account.authProgress.status.timeout"
                      : "account.authProgress.status.failed",
                  )
                : stageView.state === "completed"
                  ? t("account.authProgress.status.completed")
                  : stageView.state === "active"
                    ? t("account.authProgress.status.active")
                    : t("account.authProgress.status.pending");

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
                <div className={styles.status}>
                  <span className={styles.statusText}>{statusText}</span>
                  <StageStatusIcon state={stageView.state} failureLabel={failureLabel} />
                </div>
              </li>
            );
          })}
        </ol>

        <DialogFooter className={styles.footer}>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={busy}
            data-testid="account-ocp-progress-disconnect"
            onClick={onDisconnect}
          >
            {t("account.authProgress.disconnect")}
          </Button>
          <div className={styles.footerEnd}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !reconnectEnabled || !view.hasFailure}
              data-testid="account-ocp-progress-reconnect"
              onClick={onReconnect}
            >
              {t("account.authProgress.reconnect")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
