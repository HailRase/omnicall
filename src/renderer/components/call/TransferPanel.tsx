import type { JSX } from "react";
import type { CallLine } from "@application/index.js";
import { mapTransferDisabledReasonWithFallback } from "../../helpers/mapTransferDisabledReason.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import { MultiLineCallList } from "./MultiLineCallList.js";
import styles from "./TransferPanel.module.css";

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
      className={styles["panel"]}
      data-testid="transfer-panel"
      aria-label="Перевод звонка"
    >
      <h2 className={styles["title"]}>
        <span className={styles["titleIcon"]}>
          <AppIcon id="call.transfer" decorative />
        </span>
        Перевод звонка
      </h2>

      {transferInProgress && (
        <p
          className={styles["progress"]}
          data-testid="transfer-in-progress-indicator"
          role="status"
          aria-live="polite"
        >
          Перевод выполняется…
        </p>
      )}

      {failureMessage !== null && (
        <div
          className={styles["failure"]}
          data-testid="transfer-failure-banner"
          role="alert"
        >
          <p>{failureMessage}</p>
        </div>
      )}

      <MultiLineCallList lines={lines} />

      <label className={styles["targetLabel"]} htmlFor="transfer-target-input">
        Номер перевода
      </label>
      <input
        id="transfer-target-input"
        className={styles["targetInput"]}
        data-testid="transfer-target-input"
        type="tel"
        value={targetNumber}
        aria-label="Номер для перевода"
        onChange={(event) => {
          onTargetChange(event.currentTarget.value);
        }}
      />

      <div className={styles["actions"]}>
        <IconControlButton
          iconId="call.transfer"
          ariaLabel="Слепой перевод"
          tooltipLabel="Слепой перевод"
          testId="control-blind-transfer"
          className={styles["iconButton"]}
          disabledReason={
            blindTransferDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(blindTransferDisabledReason)
          }
          onClick={onBlindTransfer}
        />
        <IconControlButton
          iconId="transfer.consultation"
          ariaLabel="Начать консультацию"
          testId="control-start-consultation"
          className={styles["iconButton"]}
          disabledReason={
            startConsultationDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(startConsultationDisabledReason)
          }
          onClick={onStartConsultation}
        />
        <IconControlButton
          iconId="action.confirm"
          ariaLabel="Завершить перевод с консультацией"
          tooltipLabel="Завершить перевод с консультацией"
          testId="control-attended-transfer"
          className={styles["iconButton"]}
          disabledReason={
            attendedTransferDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(attendedTransferDisabledReason)
          }
          onClick={onAttendedTransfer}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Отменить перевод"
          tooltipLabel="Отменить перевод"
          testId="control-cancel-transfer"
          className={styles["iconButton"]}
          disabledReason={
            cancelTransferDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(cancelTransferDisabledReason)
          }
          onClick={onCancelTransfer}
        />
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
    <p className={styles["disabledReason"]} data-testid="transfer-disabled-reason" role="status">
      {mapTransferDisabledReasonWithFallback(reason)}
    </p>
  );
}
