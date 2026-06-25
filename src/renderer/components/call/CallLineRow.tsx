import type { JSX } from "react";
import type {
  ActiveCallControlOperationError,
  CallLineCardViewModel,
} from "@application/index.js";
import { useCallDuration } from "../../hooks/useCallDuration.js";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";
import { mapTransferDisabledReason } from "../../helpers/mapTransferDisabledReason.js";

export type CallLineRowProps = Readonly<{
  line: CallLineCardViewModel;
  lastOperationError: ActiveCallControlOperationError | null;
  compact?: boolean;
  onResume: (callId: string) => void;
  onHangup: (callId: string) => void;
  onHold: (callId: string) => void;
  onMute: (callId: string) => void;
  onUnmute: (callId: string) => void;
  onTransfer: (callId: string) => void;
  onAnswer: (callId: string) => void;
  onRetryOperation: () => void;
}>;

/**
 * - Purpose: present one unified call line row with meta, icon actions, and primary CTA.
 * - Inputs: line view-model, optional operation error, and action callbacks.
 * - Outputs: accessible legacy-inspired row UI without business logic.
 * @uiMeta lf=LF-011,LF-021,LF-022,LF-023 f=F-016 smoke=R7-*
 */
export function CallLineRow({
  line,
  lastOperationError,
  compact = false,
  onResume,
  onHangup,
  onHold,
  onMute,
  onUnmute,
  onTransfer,
  onAnswer,
  onRetryOperation,
}: CallLineRowProps): JSX.Element {
  const queueLabel = mapQueueLabelState(line.queueLabelState, line.queueName);
  const showError = !compact && line.isActiveUnheld && lastOperationError !== null;
  const rowClassName = compact ? "call-line-row call-line-row--compact" : "call-line-row";

  return (
    <li
      className={rowClassName}
      data-testid={`call-line-${line.callId}`}
      aria-label={`Call line ${line.displayName}`}
    >
      <div className="call-line-row__main">
        <div className="call-line-row__info">
          <strong className="call-line-row__name">{line.displayName}</strong>
          {!compact && queueLabel.visible ? (
            <span
              className="call-line-row__queue"
              data-testid={`call-line-queue-${line.callId}`}
              aria-busy={queueLabel.ariaBusy}
            >
              {queueLabel.text}
            </span>
          ) : null}
          <div className="call-line-row__meta">
            <CallLineDuration startedAtMs={line.durationStartedAt} callId={line.callId} />
            <span className="call-line-row__status">{line.statusLabel}</span>
            {line.muted ? (
              <span className="call-line-row__badge" data-testid={`call-line-muted-${line.callId}`}>
                Muted
              </span>
            ) : null}
          </div>
        </div>
        <div className="call-line-row__actions">
          {!compact && line.showIconRow ? (
            <div className="call-line-row__icon-row" aria-label="Call controls">
              <IconActionButton
                testId={`control-transfer-line-${line.callId}`}
                label="Transfer call"
                disabledReason={
                  line.transferDisabledReason === null
                    ? null
                    : mapTransferDisabledReason(line.transferDisabledReason)
                }
                onClick={() => {
                  onTransfer(line.callId);
                }}
              >
                ⇄
              </IconActionButton>
              <IconActionButton
                testId={`control-hold-line-${line.callId}`}
                label="Hold call"
                disabledReason={mapControlReason(line.holdDisabledReason)}
                onClick={() => {
                  onHold(line.callId);
                }}
              >
                ‖
              </IconActionButton>
              <IconActionButton
                testId={
                  line.muted
                    ? `control-unmute-line-${line.callId}`
                    : `control-mute-line-${line.callId}`
                }
                label={line.muted ? "Unmute microphone" : "Mute microphone"}
                disabledReason={mapControlReason(
                  line.muted ? line.unmuteDisabledReason : line.muteDisabledReason,
                )}
                onClick={() => {
                  if (line.muted) {
                    onUnmute(line.callId);
                  } else {
                    onMute(line.callId);
                  }
                }}
              >
                {line.muted ? "🔇" : "🎤"}
              </IconActionButton>
            </div>
          ) : null}
          <PrimaryCta
            line={line}
            onResume={onResume}
            onHangup={onHangup}
            onAnswer={onAnswer}
          />
        </div>
      </div>
      {showError ? (
        <div
          className="call-line-row__error"
          data-testid={`call-line-error-${line.callId}`}
          role="alert"
        >
          <p>{mapActiveCallControlOperationError(lastOperationError)}</p>
          <button
            type="button"
            data-testid={`control-retry-line-${line.callId}`}
            aria-label={`Retry ${lastOperationError.operation}`}
            onClick={onRetryOperation}
          >
            Retry
          </button>
        </div>
      ) : null}
      {line.resumeDisabledReason !== null ? (
        <p className="call-line-row__disabled-reason" role="status">
          {line.resumeDisabledReason}
        </p>
      ) : null}
    </li>
  );
}

type CallLineDurationProps = Readonly<{
  startedAtMs: number | null;
  callId: string;
}>;

function CallLineDuration({ startedAtMs, callId }: CallLineDurationProps): JSX.Element | null {
  const duration = useCallDuration(startedAtMs);
  if (duration.length === 0) {
    return null;
  }
  return (
    <span className="call-line-row__duration" data-testid={`call-line-duration-${callId}`}>
      {duration}
    </span>
  );
}

type IconActionButtonProps = Readonly<{
  testId: string;
  label: string;
  disabledReason: string | null;
  onClick: () => void;
  children: string;
}>;

function IconActionButton({
  testId,
  label,
  disabledReason,
  onClick,
  children,
}: IconActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="call-line-row__icon-btn"
      data-testid={testId}
      aria-label={label}
      title={disabledReason ?? undefined}
      disabled={disabledReason !== null}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type PrimaryCtaProps = Readonly<{
  line: CallLineCardViewModel;
  onResume: (callId: string) => void;
  onHangup: (callId: string) => void;
  onAnswer: (callId: string) => void;
}>;

function PrimaryCta({ line, onResume, onHangup, onAnswer }: PrimaryCtaProps): JSX.Element | null {
  if (line.primaryAction === "none") {
    return null;
  }

  if (line.primaryAction === "resume") {
    return (
      <button
        type="button"
        className="call-line-row__primary call-line-row__primary--resume"
        data-testid={`control-resume-line-${line.callId}`}
        disabled={line.resumeDisabledReason !== null}
        aria-label={`Resume call ${line.displayName}`}
        onClick={() => {
          onResume(line.callId);
        }}
      >
        Resume
      </button>
    );
  }

  if (line.primaryAction === "answer") {
    return (
      <button
        type="button"
        className="call-line-row__primary call-line-row__primary--answer"
        data-testid={`control-answer-line-${line.callId}`}
        aria-label={`Answer call ${line.displayName}`}
        onClick={() => {
          onAnswer(line.callId);
        }}
      >
        Answer
      </button>
    );
  }

  return (
    <button
      type="button"
      className="call-line-row__primary call-line-row__primary--hangup"
      data-testid={`control-hangup-line-${line.callId}`}
      disabled={line.hangupDisabledReason !== null}
      aria-label={`Hang up call ${line.displayName}`}
      onClick={() => {
        onHangup(line.callId);
      }}
    >
      Hang up
    </button>
  );
}

function mapControlReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  return mapActiveCallControlDisabledReason(reason);
}
