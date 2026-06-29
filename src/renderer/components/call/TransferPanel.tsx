import { useEffect, useMemo, useState, type JSX } from "react";
import type { CallLine } from "@application/index.js";
import { deriveCallLineStatusLabel } from "@application/index.js";
import { mapTransferDisabledReasonWithFallback } from "../../helpers/mapTransferDisabledReason.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
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

type TransferStep = 1 | 2 | 3 | 4;

/**
 * - Purpose: render transfer flow in context zone with explicit step chrome.
 * - Inputs: projection flags, disabled reasons, and action callbacks.
 * - Outputs: accessible transfer UI preserving projection-driven disabled behavior.
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
  const [step, setStep] = useState<TransferStep>(1);

  const sourceLine = useMemo(
    () =>
      lines.find((line) => line.role === "source") ??
      lines.find((line) => line.role === "primary") ??
      lines[0] ??
      null,
    [lines],
  );
  const consultationLine = useMemo(
    () => lines.find((line) => line.role === "consultation") ?? null,
    [lines],
  );

  useEffect(() => {
    if (!visible) {
      setStep(1);
      return;
    }
    if (transferInProgress) {
      setStep(4);
      return;
    }
    if (consultationLine !== null) {
      setStep(3);
      return;
    }
    if (targetNumber.trim().length === 0) {
      setStep(1);
    }
  }, [consultationLine, targetNumber, transferInProgress, visible]);

  if (!visible) {
    return null;
  }

  return (
    <section
      className={styles["panel"]}
      data-testid="transfer-panel"
      aria-label="Перевод звонка"
    >
      <header className={styles["header"]}>
        <div className={styles["titleWrap"]}>
          <h2 className={styles["title"]}>
            <span className={styles["titleIcon"]}>
              <AppIcon id="call.transfer" decorative />
            </span>
            Перевод звонка
          </h2>
          <ol className={styles["steps"]} aria-label="Шаги перевода">
            <li className={styles["step"]}>
              <span className={resolveStepDotClassName(step, 1)}>1</span>
            </li>
            <li className={styles["step"]}>
              <span className={resolveStepDotClassName(step, 2)}>2</span>
            </li>
            <li className={styles["step"]}>
              <span className={resolveStepDotClassName(step, 3)}>3</span>
            </li>
            <li className={styles["step"]}>
              <span className={resolveStepDotClassName(step, 4)}>4</span>
            </li>
          </ol>
        </div>
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Отменить перевод"
          tooltipLabel="Отменить перевод"
          testId="control-cancel-transfer"
          className={styles["closeButton"]}
          disabledReason={
            cancelTransferDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(cancelTransferDisabledReason)
          }
          onClick={() => {
            setStep(1);
            onCancelTransfer();
          }}
        />
      </header>

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

      {sourceLine !== null ? (
        <section className={styles["lineSection"]} data-testid="transfer-source-line">
          <p className={styles["lineSectionTitle"]}>Исходный звонок</p>
          <div className={styles["lineCard"]}>
            <p className={styles["lineLabel"]}>{sourceLine.displayLabel}</p>
            <p className={styles["lineState"]}>
              {deriveCallLineStatusLabel({ state: sourceLine.state })}
            </p>
          </div>
        </section>
      ) : null}

      {step >= 3 && consultationLine !== null ? (
        <section className={styles["lineSection"]} data-testid="transfer-consultation-line">
          <p className={styles["lineSectionTitle"]}>Консультационный звонок</p>
          <div className={styles["lineCard"]}>
            <p className={styles["lineLabel"]}>{consultationLine.displayLabel}</p>
            <p className={styles["lineState"]}>
              {deriveCallLineStatusLabel({ state: consultationLine.state })}
            </p>
          </div>
        </section>
      ) : null}

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
      {step === 1 ? (
        <button
          type="button"
          data-testid="transfer-next-step"
          className={styles["nextButton"]}
          disabled={targetNumber.trim().length === 0}
          onClick={() => {
            setStep(2);
          }}
        >
          Далее
        </button>
      ) : null}

      <div className={styles["actions"]}>
        {step >= 2 ? (
          <>
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
              onClick={() => {
                setStep(4);
                onBlindTransfer();
              }}
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
              onClick={() => {
                setStep(3);
                onStartConsultation();
              }}
            />
          </>
        ) : null}
        {step >= 3 ? (
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
            onClick={() => {
              setStep(4);
              onAttendedTransfer();
            }}
          />
        ) : null}
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

function resolveStepDotClassName(currentStep: TransferStep, step: TransferStep): string {
  const baseClass = styles["stepDot"] ?? "";
  const activeClass = styles["stepDotActive"] ?? "";
  const doneClass = styles["stepDotDone"] ?? "";
  if (step === currentStep) {
    return `${baseClass} ${activeClass}`.trim();
  }
  if (step < currentStep) {
    return `${baseClass} ${doneClass}`.trim();
  }
  return baseClass;
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
