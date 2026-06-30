import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import type { IncomingCallUiState, QueueLabelState } from "@application/index.js";
import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";
import { AppIcon } from "../icons/index.js";
import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import styles from "./IncomingCallOverlay.module.css";

export type IncomingCallOverlayProps = Readonly<{
  visible: boolean;
  callerNumber: string | null;
  displayName: string | null;
  queueLabelState: QueueLabelState;
  queueName: string | null;
  campaignContextTitle: string | null;
  autoAnswerSecondsRemaining: number | null;
  uiState: IncomingCallUiState;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
  onAnswer: () => void;
  onReject: () => void;
}>;

function resolvePrimaryLabel(
  displayName: string | null,
  callerNumber: string | null,
): string {
  if (displayName !== null && displayName.trim().length > 0) {
    return displayName;
  }
  return callerNumber ?? "Неизвестный абонент";
}

function shouldShowStatusMessage(uiState: IncomingCallUiState): boolean {
  return (
    uiState === "answerFailed" ||
    uiState === "rejectFailed" ||
    uiState === "incomingEndedBeforeAnswer" ||
    uiState === "dndAutoRejecting"
  );
}

/**
 * - Purpose: non-blocking incoming call banner with accept/reject actions (F-002).
 * - Inputs: caller identity, queue/campaign badges, disabled reasons, callbacks.
 * - Outputs: top overlay UI; answer/reject intents via props only.
 * @uiMeta lf=LF-013,LF-014 f=F-002 smoke=R3-2
 */
export function IncomingCallOverlay({
  visible,
  callerNumber,
  displayName,
  queueLabelState,
  queueName,
  campaignContextTitle,
  autoAnswerSecondsRemaining,
  uiState,
  answerDisabledReason,
  rejectDisabledReason,
  onAnswer,
  onReject,
}: IncomingCallOverlayProps): JSX.Element | null {
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

  const queueBadge = mapQueueLabelState(queueLabelState, queueName);
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
      onAnswer();
      return;
    }
    if (event.key === "Escape" && rejectDisabledReason === null) {
      onReject();
    }
  };

  return (
    <section
      ref={overlayRef}
      role="dialog"
      aria-label="Входящий вызов"
      tabIndex={-1}
      className={styles["overlay"]}
      data-testid="incoming-call-overlay"
      onKeyDown={handleKeyDown}
    >
      {autoAnswerActive ? (
        <div className={styles["autoAnswerTrack"]} aria-hidden="true">
          <div
            className={styles["autoAnswerFill"]}
            style={{ width: `${autoAnswerProgress}%` }}
          />
        </div>
      ) : null}

      <div className={styles["body"]}>
        <div className={styles["headerRow"]}>
          <div className={styles["iconCircle"]}>
            <AppIcon id="call.incoming" size={16} decorative />
          </div>
          <div className={styles["identity"]} data-testid="caller-identity">
            <p className={styles["eyebrow"]}>
              Входящий вызов
              {autoAnswerActive && autoAnswerSecondsRemaining !== null ? (
                <span
                  className={styles["autoAnswerHint"]}
                  data-testid="auto-answer-countdown"
                  aria-live="polite"
                >
                  · {formatAutoAnswerCountdownLabel(autoAnswerSecondsRemaining)}
                </span>
              ) : null}
            </p>
            <p className={styles["primaryName"]}>{resolvePrimaryLabel(displayName, callerNumber)}</p>
            {hasName ? (
              <p className={styles["secondaryNumber"]}>{callerNumber}</p>
            ) : null}
          </div>
        </div>

        {queueBadge.visible || campaignContextTitle !== null ? (
          <div className={styles["badges"]}>
            {queueBadge.visible ? (
              <span
                className={styles["badgeQueue"]}
                data-testid="queue-info-label"
                aria-busy={queueBadge.ariaBusy}
              >
                {queueBadge.text}
              </span>
            ) : null}
            {campaignContextTitle !== null ? (
              <span
                className={styles["badgeCampaign"]}
                data-testid="incoming-campaign-context"
              >
                {campaignContextTitle}
              </span>
            ) : null}
          </div>
        ) : null}

        {shouldShowStatusMessage(uiState) ? (
          <div className={styles["statusBlock"]}>
            <IncomingCallStatusMessage uiState={uiState} />
          </div>
        ) : null}

        {answerDisabledReason !== null ? (
          <p
            className={styles["disabledReason"]}
            data-testid="incoming-answer-disabled-reason"
            role="status"
          >
            {answerDisabledReason}
          </p>
        ) : null}

        <div className={styles["actions"]}>
          <button
            type="button"
            className={styles["rejectButton"]}
            data-testid="reject-call"
            aria-label="Отклонить вызов"
            disabled={rejectDisabledReason !== null}
            onClick={onReject}
          >
            <span className={styles["buttonIcon"]}>
              <AppIcon id="call.reject" size={15} decorative />
            </span>
            <span>Отклонить</span>
          </button>
          <button
            type="button"
            className={styles["answerButton"]}
            data-testid="answer-call"
            aria-label="Ответить на вызов"
            disabled={answerDisabledReason !== null}
            onClick={onAnswer}
          >
            <span className={styles["buttonIcon"]}>
              <AppIcon id="call.answer" size={15} decorative />
            </span>
            <span>Ответить</span>
          </button>
        </div>
      </div>
    </section>
  );
}
