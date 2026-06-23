import type { JSX } from "react";
import type { CallLine } from "@application/index.js";
import { mapTransferDisabledReasonWithFallback } from "../../helpers/mapTransferDisabledReason.js";
import { MultiLineCallList } from "./MultiLineCallList.js";

export type TransferPanelProps = Readonly<{
  visible: boolean;
  targetNumber: string;
  blindTransferDisabledReason: string | null;
  startConsultationDisabledReason: string | null;
  attendedTransferDisabledReason: string | null;
  cancelTransferDisabledReason: string | null;
  transferInProgress: boolean;
  failureMessage: string | null;
  lines: ReadonlyArray<CallLine>;
  onTargetChange: (value: string) => void;
  onBlindTransfer: () => void;
  onStartConsultation: () => void;
  onAttendedTransfer: () => void;
  onCancelTransfer: () => void;
}>;

/**
 * - Purpose: render presentational transfer mode panel and action controls.
 * - Inputs: projection flags, disabled reasons, and action callbacks.
 * - Outputs: accessible transfer UI without business logic.
 */
export function TransferPanel({
  visible,
  targetNumber,
  blindTransferDisabledReason,
  startConsultationDisabledReason,
  attendedTransferDisabledReason,
  cancelTransferDisabledReason,
  transferInProgress,
  failureMessage,
  lines,
  onTargetChange,
  onBlindTransfer,
  onStartConsultation,
  onAttendedTransfer,
  onCancelTransfer,
}: TransferPanelProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <section
      className="transfer-panel"
      data-testid="transfer-panel"
      aria-label="Transfer call"
    >
      <h2>Transfer Call</h2>

      {transferInProgress && (
        <p
          className="transfer-panel__progress"
          data-testid="transfer-in-progress-indicator"
          role="status"
          aria-live="polite"
        >
          Transfer in progress…
        </p>
      )}

      {failureMessage !== null && (
        <div
          className="transfer-panel__failure"
          data-testid="transfer-failure-banner"
          role="alert"
        >
          <p>{failureMessage}</p>
        </div>
      )}

      <MultiLineCallList lines={lines} />

      <label className="transfer-panel__target-label" htmlFor="transfer-target-input">
        Transfer target
      </label>
      <input
        id="transfer-target-input"
        className="transfer-panel__target-input"
        data-testid="transfer-target-input"
        type="tel"
        value={targetNumber}
        aria-label="Transfer target number"
        onChange={(event) => {
          onTargetChange(event.currentTarget.value);
        }}
      />

      <div className="transfer-panel__actions">
        <button
          type="button"
          data-testid="control-blind-transfer"
          aria-label="Blind transfer"
          disabled={blindTransferDisabledReason !== null}
          onClick={onBlindTransfer}
        >
          Blind transfer
        </button>
        <button
          type="button"
          data-testid="control-start-consultation"
          aria-label="Start consultation"
          disabled={startConsultationDisabledReason !== null}
          onClick={onStartConsultation}
        >
          Start consultation
        </button>
        <button
          type="button"
          data-testid="control-attended-transfer"
          aria-label="Complete attended transfer"
          disabled={attendedTransferDisabledReason !== null}
          onClick={onAttendedTransfer}
        >
          Complete attended transfer
        </button>
        <button
          type="button"
          data-testid="control-cancel-transfer"
          aria-label="Cancel transfer"
          disabled={cancelTransferDisabledReason !== null}
          onClick={onCancelTransfer}
        >
          Cancel transfer
        </button>
      </div>

      {renderDisabledReason(
        blindTransferDisabledReason,
        startConsultationDisabledReason,
        attendedTransferDisabledReason,
        cancelTransferDisabledReason,
      )}
    </section>
  );
}

function renderDisabledReason(
  blindReason: string | null,
  consultationReason: string | null,
  attendedReason: string | null,
  cancelReason: string | null,
): JSX.Element | null {
  const reason = blindReason ?? consultationReason ?? attendedReason ?? cancelReason;
  if (reason === null) {
    return null;
  }

  return (
    <p data-testid="transfer-disabled-reason" role="status">
      {mapTransferDisabledReasonWithFallback(reason)}
    </p>
  );
}
