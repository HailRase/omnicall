import clsx from "clsx";
import type { JSX } from "react";
import type { IncomingCallUiState } from "@application/index.js";
import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { IncomingCallRejectControl } from "./IncomingCallRejectControl.js";
import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import { TruncatedTextLine } from "./TruncatedTextLine.js";
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
  /** When true, reject opens OCP without/with-break choice menu. */
  rejectChoiceEnabled?: boolean;
  onSelect: () => void;
  onAnswer: () => void;
  onAnswerWithVideo?: (() => void) | undefined;
  onReject: () => void;
  onRejectWithoutBreak?: () => void;
  onRejectWithBreak?: () => void;
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

/**
 * - Purpose: selectable incoming call session card in call context zone.
 * - Inputs: caller identity, selection state, audio/video answer callbacks.
 * - Outputs: frosted-glass incoming card with icon-only accept/reject controls.
 * @uiMeta lf=LF-013,LF-014 f=F-002,F-027,F-028 smoke=R3-2
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
  rejectChoiceEnabled = false,
  onSelect,
  onAnswer,
  onAnswerWithVideo,
  onReject,
  onRejectWithoutBreak,
  onRejectWithBreak,
}: IncomingCallSessionCardProps): JSX.Element {
  const { t } = useI18n();
  const hasName =
    displayName !== null && displayName.trim().length > 0 && callerNumber !== null;
  const primaryLabel = resolvePrimaryLabel(t, displayName, callerNumber);
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

      <div className={styles.mainRow}>
        <button
          type="button"
          className={styles.rowSurface}
          data-testid="incoming-call-session-select"
          aria-label={t("incoming.selectAria", { primary: primaryLabel })}
          aria-selected={isSelected}
          onClick={onSelect}
        />
        <div className={styles.mainRowForeground}>
          <div className={styles.iconCircle} aria-hidden="true">
            <AppIcon id="call.incoming" size={18} preferAnimated={false} decorative />
          </div>

          <div className={styles.identity} data-testid="caller-identity">
            <TruncatedTextLine text={primaryLabel} className={styles.primaryName} />
            {hasName && callerNumber !== null ? (
              <TruncatedTextLine text={callerNumber} className={styles.secondaryNumber} />
            ) : null}
            <p className={styles.incomingHint} data-testid="incoming-call-status-label">
              {t("incoming.status.default")}
            </p>
            {autoAnswerActive && autoAnswerSecondsRemaining !== null ? (
              <p
                className={styles.autoAnswerHint}
                data-testid="auto-answer-countdown"
                aria-live="polite"
              >
                {formatAutoAnswerCountdownLabel(autoAnswerSecondsRemaining)}
              </p>
            ) : null}
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={clsx(styles.actionButton, styles.answerButton)}
              data-testid="answer-call"
              aria-label={t("incoming.answerAria")}
              disabled={answerDisabledReason !== null}
              onClick={onAnswer}
            >
              <AppIcon id="call.answer" size={16} decorative />
            </button>
            {onAnswerWithVideo !== undefined ? (
              <button
                type="button"
                className={clsx(styles.actionButton, styles.answerVideoButton)}
                data-testid="answer-call-video"
                aria-label={t("incoming.answerVideoAria")}
                disabled={videoAnswerDisabledReason !== null}
                onClick={onAnswerWithVideo}
              >
                <AppIcon id="dial.videoCall" size={16} decorative />
              </button>
            ) : null}
            <IncomingCallRejectControl
              rejectDisabledReason={rejectDisabledReason}
              rejectChoiceEnabled={rejectChoiceEnabled}
              onReject={onReject}
              onRejectWithoutBreak={onRejectWithoutBreak ?? onReject}
              onRejectWithBreak={onRejectWithBreak ?? onReject}
              className={clsx(styles.actionButton, styles.rejectButton)}
            />
          </div>
        </div>
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
    </article>
  );
}
