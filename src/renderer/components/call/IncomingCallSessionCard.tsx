import clsx from "clsx";
import type { JSX } from "react";
import type { IncomingCallUiState } from "@application/index.js";
import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import styles from "./IncomingCallSessionCard.module.css";

export type IncomingCallSessionCardProps = Readonly<{
  callId: string;
  callerNumber: string | null;
  displayName: string | null;
  autoAnswerSecondsRemaining: number | null;
  autoAnswerTimeoutSec: number | null;
  uiState: IncomingCallUiState;
  isSelected: boolean;
  answerDisabledReason: string | null;
  videoAnswerDisabledReason?: string | null;
  rejectDisabledReason: string | null;
  onSelect: () => void;
  onAnswer: () => void;
  onAnswerWithVideo?: (() => void) | undefined;
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
 * - Purpose: selectable incoming call session card in call context zone.
 * - Inputs: caller identity, selection state, audio/video answer callbacks.
 * - Outputs: answer, video answer, reject controls with status hints.
 * @uiMeta lf=LF-013,LF-014 f=F-002,F-027 smoke=R3-2
 */
export function IncomingCallSessionCard({
  callId,
  callerNumber,
  displayName,
  autoAnswerSecondsRemaining,
  autoAnswerTimeoutSec,
  uiState,
  isSelected,
  answerDisabledReason,
  videoAnswerDisabledReason = null,
  rejectDisabledReason,
  onSelect,
  onAnswer,
  onAnswerWithVideo,
  onReject,
}: IncomingCallSessionCardProps): JSX.Element {
  const { t } = useI18n();
  const identity = resolveCallerIdentity(t, callerNumber, displayName);
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
        {onAnswerWithVideo !== undefined ? (
          <button
            type="button"
            className={styles.answerVideoButton}
            data-testid="answer-call-video"
            aria-label={t("incoming.answerVideoAria")}
            disabled={videoAnswerDisabledReason !== null}
            onClick={onAnswerWithVideo}
          >
            <span className={styles.buttonIcon}>
              <AppIcon id="dial.videoCall" size={14} decorative />
            </span>
            <span>{t("incoming.answerVideoLabel")}</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
