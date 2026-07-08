import { useEffect, useRef, type JSX, type KeyboardEvent, type MouseEvent } from "react";

import type { IncomingCallUiState } from "@application/index.js";

import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";

import { useI18n } from "../../i18n/index.js";

import { AppIcon } from "../icons/index.js";
import { IconButton } from "../ui/icon-button/index.js";

import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";

import styles from "./IncomingCallOverlay.module.css";

export type IncomingCallOverlayProps = Readonly<{
  visible: boolean;
  callerNumber: string | null;
  displayName: string | null;
  autoAnswerSecondsRemaining: number | null;
  uiState: IncomingCallUiState;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
  onOpenCallSurface: () => void;
  onAnswer: () => void;
  onReject: () => void;
  onDismiss: () => void;
}>;

function resolvePrimaryLabel(
  t: ReturnType<typeof useI18n>["t"],
  displayName: string | null,
  callerNumber: string | null,
): string {
  if (displayName !== null && displayName.trim().length > 0) {
    return displayName;
  }
  return callerNumber ?? t("incoming.unknownCaller");
}

function shouldShowStatusMessage(uiState: IncomingCallUiState): boolean {
  return (
    uiState === "answerFailed" ||
    uiState === "rejectFailed" ||
    uiState === "incomingEndedBeforeAnswer" ||
    uiState === "dndAutoRejecting"
  );
}

function stopActionPropagation(event: MouseEvent<HTMLButtonElement>): void {
  event.stopPropagation();
}

/**
 * - Purpose: non-blocking iPhone-like incoming call banner with accept/reject actions (F-002).
 * - Inputs: caller identity, disabled reasons, and overlay action callbacks.
 * - Outputs: top-center overlay UI; intents emitted via props only.
 * @uiMeta lf=LF-013,LF-014 f=F-002 smoke=R3-2
 */
export function IncomingCallOverlay({
  visible,
  callerNumber,
  displayName,
  autoAnswerSecondsRemaining,
  uiState,
  answerDisabledReason,
  rejectDisabledReason,
  onOpenCallSurface,
  onAnswer,
  onReject,
  onDismiss,
}: IncomingCallOverlayProps): JSX.Element | null {
  const { t } = useI18n();
  const overlayRef = useRef<HTMLElement | null>(null);
  const autoAnswerTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      overlayRef.current?.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (autoAnswerSecondsRemaining === null) {
      autoAnswerTotalRef.current = null;
      return;
    }
    if (autoAnswerTotalRef.current === null) {
      autoAnswerTotalRef.current = autoAnswerSecondsRemaining;
    }
  }, [autoAnswerSecondsRemaining]);

  if (!visible) {
    return null;
  }

  const hasName =
    displayName !== null && displayName.trim().length > 0 && callerNumber !== null;
  const autoAnswerActive = autoAnswerSecondsRemaining !== null;
  const autoAnswerTotal = autoAnswerTotalRef.current ?? autoAnswerSecondsRemaining ?? 1;
  const autoAnswerProgress =
    autoAnswerActive && autoAnswerSecondsRemaining !== null
      ? Math.max(0, Math.min(100, (autoAnswerSecondsRemaining / autoAnswerTotal) * 100))
      : 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" && answerDisabledReason === null) {
      event.preventDefault();
      onAnswer();
      return;
    }
    if (event.key === "Escape" && rejectDisabledReason === null) {
      event.preventDefault();
      onReject();
    }
  };

  const handleBodyKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onOpenCallSurface();
    }
  };

  return (
    <div className={styles.anchor} data-testid="incoming-call-overlay-anchor">
      <section
        ref={overlayRef}
        role="dialog"
        aria-label={t("incoming.ariaLabel")}
        tabIndex={-1}
        className={styles.overlay}
        data-testid="incoming-call-overlay"
        onKeyDown={handleKeyDown}
      >
        {autoAnswerActive ? (
          <div className={styles.autoAnswerTrack} aria-hidden="true">
            <div
              className={styles.autoAnswerFill}
              style={{ width: `${autoAnswerProgress}%` }}
            />
          </div>
        ) : null}

        <div className={styles.body}>
          <div className={styles.headerRow}>
            <button
              type="button"
              className={styles.bodyButton}
              data-testid="incoming-call-overlay-body"
              aria-label={t("incoming.openCallSurfaceAria")}
              onClick={onOpenCallSurface}
              onKeyDown={handleBodyKeyDown}
            >
              <div className={styles.iconCircle}>
                <AppIcon id="call.incoming" size={16} decorative />
              </div>
              <div className={styles.identity} data-testid="caller-identity">
                <p className={styles.eyebrow}>
                  {t("incoming.eyebrow")}
                  {autoAnswerActive && autoAnswerSecondsRemaining !== null ? (
                    <span
                      className={styles.autoAnswerHint}
                      data-testid="auto-answer-countdown"
                      aria-live="polite"
                    >
                      · {formatAutoAnswerCountdownLabel(autoAnswerSecondsRemaining)}
                    </span>
                  ) : null}
                </p>
                <p className={styles.primaryName}>
                  {resolvePrimaryLabel(t, displayName, callerNumber)}
                </p>
                {hasName ? <p className={styles.secondaryNumber}>{callerNumber}</p> : null}
              </div>
            </button>

            <IconButton
              type="button"
              iconId="overlay.close"
              variant="ghost"
              size="sm"
              className={styles.dismissButton}
              data-testid="incoming-call-overlay-dismiss"
              ariaLabel={t("incoming.dismissAria")}
              tooltipLabel={t("incoming.dismissAria")}
              onClick={(event) => {
                stopActionPropagation(event);
                onDismiss();
              }}
            />
          </div>

          {shouldShowStatusMessage(uiState) ? (
            <div className={styles.statusBlock}>
              <IncomingCallStatusMessage uiState={uiState} />
            </div>
          ) : null}

          {answerDisabledReason !== null ? (
            <p
              className={styles.disabledReason}
              data-testid="incoming-answer-disabled-reason"
              role="status"
            >
              {answerDisabledReason}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.rejectButton}
              data-testid="reject-call"
              aria-label={t("incoming.rejectAria")}
              disabled={rejectDisabledReason !== null}
              onClick={(event) => {
                stopActionPropagation(event);
                onReject();
              }}
            >
              <span className={styles.buttonIcon}>
                <AppIcon id="call.reject" size={15} decorative />
              </span>
              <span>{t("incoming.rejectLabel")}</span>
            </button>
            <button
              type="button"
              className={styles.answerButton}
              data-testid="answer-call"
              aria-label={t("incoming.answerAria")}
              disabled={answerDisabledReason !== null}
              onClick={(event) => {
                stopActionPropagation(event);
                onAnswer();
              }}
            >
              <span className={styles.buttonIcon}>
                <AppIcon id="call.answer" size={15} decorative />
              </span>
              <span>{t("incoming.answerLabel")}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
