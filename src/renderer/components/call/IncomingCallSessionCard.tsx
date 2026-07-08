import clsx from "clsx";
import type { JSX } from "react";
import type { IncomingCallUiState, QueueLabelState } from "@application/index.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";
import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import styles from "./IncomingCallSessionCard.module.css";

export type IncomingCallSessionCardProps = Readonly<{
  callId: string;
  callerNumber: string | null;
  displayName: string | null;
  queueLabelState: QueueLabelState;
  queueName: string | null;
  campaignContextTitle: string | null;
  autoAnswerSecondsRemaining: number | null;
  autoAnswerTimeoutSec: number | null;
  uiState: IncomingCallUiState;
  isSelected: boolean;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
  onSelect: () => void;
  onAnswer: () => void;
  onReject: () => void;
}>;

function resolveCallerIdentity(
  t: ReturnType<typeof useI18n>["t"],
  callerNumber: string | null,
  displayName: string | null,
): Readonly<{ primary: string; secondary: string | null }> {
  const trimmedName = displayName?.trim() ?? "";
  const trimmedNumber = callerNumber?.trim() ?? "";

  if (trimmedName.length > 0) {
    const secondary =
      trimmedNumber.length > 0 && trimmedName !== trimmedNumber ? trimmedNumber : null;
    return { primary: trimmedName, secondary };
  }

  if (trimmedNumber.length > 0) {
    return { primary: trimmedNumber, secondary: null };
  }

  return { primary: t("incoming.unknownNumber"), secondary: null };
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
 * - Purpose: selectable incoming call session card in the call context zone (F-002).
 * - Inputs: caller identity, queue/campaign badges, selection state, action callbacks.
 * - Outputs: green session card with answer/reject controls; intents via props only.
 * @uiMeta lf=LF-013,LF-014 f=F-002 smoke=R3-2
 */
export function IncomingCallSessionCard({
  callId,
  callerNumber,
  displayName,
  queueLabelState,
  queueName,
  campaignContextTitle,
  autoAnswerSecondsRemaining,
  autoAnswerTimeoutSec,
  uiState,
  isSelected,
  answerDisabledReason,
  rejectDisabledReason,
  onSelect,
  onAnswer,
  onReject,
}: IncomingCallSessionCardProps): JSX.Element {
  const { t } = useI18n();
  const identity = resolveCallerIdentity(t, callerNumber, displayName);
  const queueBadge = mapQueueLabelState(queueLabelState, queueName);
  const autoAnswerActive =
    autoAnswerSecondsRemaining !== null && autoAnswerTimeoutSec !== null;
  const autoAnswerProgress =
    autoAnswerActive && autoAnswerTimeoutSec > 0
      ? Math.max(
          0,
          Math.min(100, (autoAnswerSecondsRemaining / autoAnswerTimeoutSec) * 100),
        )
      : 0;

  return (
    <article
      className={clsx(styles.card, isSelected && styles.cardSelected)}
      data-testid={`incoming-call-session-${callId}`}
      aria-label={t("incoming.ariaLabel")}
    >
      {autoAnswerActive ? (
        <div className={styles.autoAnswerTrack} aria-hidden="true">
          <div
            className={styles.autoAnswerFill}
            style={{ width: `${autoAnswerProgress}%` }}
          />
        </div>
      ) : null}

      <button
        type="button"
        className={styles.selectArea}
        data-testid="incoming-call-session-select"
        aria-label={t("incoming.selectAria", { primary: identity.primary })}
        aria-selected={isSelected}
        onClick={onSelect}
      >
        <span className={styles.avatar} aria-hidden>
          <AppIcon id="call.incoming" size={16} decorative />
        </span>
        <span className={styles.identity} data-testid="caller-identity">
          <p className={styles.number}>{identity.primary}</p>
          {identity.secondary !== null ? (
            <p className={styles.displayName}>{identity.secondary}</p>
          ) : null}
          <span className={styles.statusRow}>
            <span className={styles.pulse} aria-hidden />
            <span className={styles.status} data-testid="incoming-call-status-label">
              {t("incoming.status.default")}
            </span>
          </span>
          {autoAnswerActive && autoAnswerSecondsRemaining !== null ? (
            <p
              className={styles.autoAnswerHint}
              data-testid="auto-answer-countdown"
              aria-live="polite"
            >
              {formatAutoAnswerCountdownLabel(autoAnswerSecondsRemaining)}
            </p>
          ) : null}
        </span>
      </button>

      {queueBadge.visible || campaignContextTitle !== null ? (
        <div className={styles.badges}>
          {queueBadge.visible ? (
            <span
              className={styles.badgeQueue}
              data-testid="queue-info-label"
              aria-busy={queueBadge.ariaBusy}
            >
              {queueBadge.text}
            </span>
          ) : null}
          {campaignContextTitle !== null ? (
            <span
              className={styles.badgeCampaign}
              data-testid="incoming-campaign-context"
            >
              {campaignContextTitle}
            </span>
          ) : null}
        </div>
      ) : null}

      {shouldShowStatusMessage(uiState) ? (
        <div className={styles.badges}>
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
          onClick={onReject}
        >
          <span className={styles.buttonIcon}>
            <AppIcon id="call.reject" size={14} decorative />
          </span>
          <span>{t("incoming.rejectLabel")}</span>
        </button>
        <button
          type="button"
          className={styles.answerButton}
          data-testid="answer-call"
          aria-label={t("incoming.answerAria")}
          disabled={answerDisabledReason !== null}
          onClick={onAnswer}
        >
          <span className={styles.buttonIcon}>
            <AppIcon id="call.answer" size={14} decorative />
          </span>
          <span>{t("incoming.answerLabel")}</span>
        </button>
      </div>
    </article>
  );
}
