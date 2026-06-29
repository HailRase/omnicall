import clsx from "clsx";
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
import { IconControlButton } from "../icons/index.js";
import styles from "./CallLineRow.module.css";

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

  return (
    <li
      className={clsx(compact ? styles["rowCompact"] : styles["row"])}
      data-testid={`call-line-${line.callId}`}
      aria-label={`Линия звонка ${line.displayName}`}
    >
      <div className={styles["main"]}>
        <div className={styles["info"]}>
          <strong className={styles["name"]}>{line.displayName}</strong>
          {!compact && queueLabel.visible ? (
            <span
              className={styles["queue"]}
              data-testid={`call-line-queue-${line.callId}`}
              aria-busy={queueLabel.ariaBusy}
            >
              {queueLabel.text}
            </span>
          ) : null}
          <div className={styles["meta"]}>
            <CallLineDuration startedAtMs={line.durationStartedAt} callId={line.callId} />
            <span>{line.statusLabel}</span>
            {line.muted ? (
              <span className={styles["badge"]} data-testid={`call-line-muted-${line.callId}`}>
                Без звука
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles["actions"]}>
          {!compact && line.showIconRow ? (
            <div className={styles["iconRow"]} aria-label="Управление звонком">
              <IconControlButton
                iconId="call.transfer"
                ariaLabel="Перевести звонок"
                testId={`control-transfer-line-${line.callId}`}
                className={styles["iconButton"]}
                disabledReason={
                  line.transferDisabledReason === null
                    ? null
                    : mapTransferDisabledReason(line.transferDisabledReason)
                }
                onClick={() => {
                  onTransfer(line.callId);
                }}
              />
              <IconControlButton
                iconId="call.hold"
                ariaLabel="Удержать звонок"
                testId={`control-hold-line-${line.callId}`}
                className={styles["iconButton"]}
                disabledReason={mapControlReason(line.holdDisabledReason)}
                onClick={() => {
                  onHold(line.callId);
                }}
              />
              <IconControlButton
                iconId={line.muted ? "call.mute" : "call.unmute"}
                ariaLabel={line.muted ? "Включить микрофон" : "Отключить микрофон"}
                testId={
                  line.muted
                    ? `control-unmute-line-${line.callId}`
                    : `control-mute-line-${line.callId}`
                }
                className={styles["iconButton"]}
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
              />
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
          className={styles["error"]}
          data-testid={`call-line-error-${line.callId}`}
          role="alert"
        >
          <p>{mapActiveCallControlOperationError(lastOperationError)}</p>
          <IconControlButton
            iconId="action.retry"
            ariaLabel={`Retry ${lastOperationError.operation}`}
            tooltipLabel="Повторить"
            testId={`control-retry-line-${line.callId}`}
            className={styles["iconButton"]}
            onClick={onRetryOperation}
          />
        </div>
      ) : null}
      {line.resumeDisabledReason !== null ? (
        <p className={styles["disabledReason"]} role="status">
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
    <span className={styles["duration"]} data-testid={`call-line-duration-${callId}`}>
      {duration}
    </span>
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
      <IconControlButton
        iconId="call.resume"
        ariaLabel={`Возобновить звонок ${line.displayName}`}
        testId={`control-resume-line-${line.callId}`}
        className={clsx(styles["primaryIconButton"], styles["primaryResume"])}
        disabledReason={line.resumeDisabledReason}
        onClick={() => {
          onResume(line.callId);
        }}
      />
    );
  }

  if (line.primaryAction === "answer") {
    return (
      <IconControlButton
        iconId="call.answer"
        ariaLabel={`Ответить на звонок ${line.displayName}`}
        testId={`control-answer-line-${line.callId}`}
        className={clsx(styles["primaryIconButton"], styles["primaryAnswer"])}
        onClick={() => {
          onAnswer(line.callId);
        }}
      />
    );
  }

  return (
    <IconControlButton
      iconId="call.hangup"
      ariaLabel={`Завершить звонок ${line.displayName}`}
      testId={`control-hangup-line-${line.callId}`}
      className={clsx(styles["primaryIconButton"], styles["primaryHangup"])}
      disabledReason={line.hangupDisabledReason}
      onClick={() => {
        onHangup(line.callId);
      }}
    />
  );
}

function mapControlReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  return mapActiveCallControlDisabledReason(reason);
}
