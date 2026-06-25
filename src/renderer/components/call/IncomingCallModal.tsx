import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import type { IncomingCallUiState, QueueLabelState } from "@application/index.js";
import { AppIcon } from "../icons/index.js";
import { AutoAnswerCountdown } from "./AutoAnswerCountdown.js";
import { CallerIdentityBlock } from "./CallerIdentityBlock.js";
import { IncomingCallActions } from "./IncomingCallActions.js";
import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import { RejectReasonSelector } from "./RejectReasonSelector.js";
import styles from "./IncomingCallModal.module.css";

export type IncomingCallModalProps = Readonly<{
  visible: boolean;
  callerNumber: string | null;
  displayName: string | null;
  queueLabelState: QueueLabelState;
  queueName: string | null;
  campaignContextTitle: string | null;
  ringingState: "idle" | "ringing";
  autoAnswerSecondsRemaining: number | null;
  uiState: IncomingCallUiState;
  rejectReasonRequired: boolean;
  rejectReasons: ReadonlyArray<string>;
  selectedBreakReason: string | null;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
  onAnswer: () => void;
  onReject: () => void;
  onSelectBreakReason: (reason: string) => void;
}>;

export function IncomingCallModal({
  visible,
  callerNumber,
  displayName,
  queueLabelState,
  queueName,
  campaignContextTitle,
  ringingState,
  autoAnswerSecondsRemaining,
  uiState,
  rejectReasonRequired,
  rejectReasons,
  selectedBreakReason,
  answerDisabledReason,
  rejectDisabledReason,
  onAnswer,
  onReject,
  onSelectBreakReason,
}: IncomingCallModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (visible) {
      modalRef.current?.focus();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" && answerDisabledReason === null) {
      onAnswer();
      return;
    }
    if (event.key === "Escape" && rejectDisabledReason === null) {
      onReject();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      "button, select, [tabindex]:not([tabindex='-1'])",
    );
    if (focusable === undefined || focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section
      ref={modalRef}
      role="dialog"
      aria-label="Incoming call"
      tabIndex={-1}
      className={styles["modal"]}
      data-testid="incoming-call-modal"
      onKeyDown={handleKeyDown}
    >
      <h2 className={styles["title"]}>
        <span className={styles["titleIcon"]}>
          <AppIcon id="call.incoming" decorative />
        </span>
        Incoming Call
      </h2>
      <p data-testid="ringing-indicator">
        <strong>Ringing:</strong> {ringingState}
      </p>
      <CallerIdentityBlock
        callerNumber={callerNumber}
        displayName={displayName}
        queueLabelState={queueLabelState}
        queueName={queueName}
        campaignContextTitle={campaignContextTitle}
      />
      <IncomingCallStatusMessage uiState={uiState} />
      <AutoAnswerCountdown secondsRemaining={autoAnswerSecondsRemaining} />

      <RejectReasonSelector
        reasons={rejectReasons}
        selectedReason={selectedBreakReason}
        required={rejectReasonRequired}
        disabled={rejectDisabledReason !== null}
        onSelect={onSelectBreakReason}
      />

      <IncomingCallActions
        answerDisabledReason={answerDisabledReason}
        rejectDisabledReason={rejectDisabledReason}
        onAnswer={onAnswer}
        onReject={onReject}
      />
    </section>
  );
}
