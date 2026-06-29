import { useEffect, useMemo, useState, type JSX, type MouseEvent } from "react";
import type { CallLine } from "@application/index.js";
import { deriveCallLineStatusLabel, isDialpadNumberValid } from "@application/index.js";
import clsx from "clsx";
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
  failureTitle: string | null;
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
  failureTitle,
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
  const consultReady = consultationLine?.state === "Active";
  const isTargetNumberValid = isDialpadNumberValid(targetNumber);

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
    if (step >= 3 && !transferInProgress) {
      setStep(2);
      return;
    }
    if (!isTargetNumberValid) {
      setStep(1);
    }
  }, [consultationLine, isTargetNumberValid, step, transferInProgress, visible]);

  if (!visible) {
    return null;
  }

  const cancelDisabled = cancelTransferDisabledReason !== null;
  const cancelLabel = failureMessage !== null ? "Закрыть" : "Отмена";

  return (
    <section
      className={styles["panel"]}
      data-testid="transfer-panel"
      aria-label="Перевод звонка"
    >
      <header className={styles["header"]}>
        <div className={styles["titleWrap"]}>
          <h2 className={styles["title"]}>Перевод звонка</h2>
          <ol className={styles["steps"]} aria-label="Шаги перевода">
            {[1, 2, 3, 4].map((stepNum) => (
              <li key={stepNum} className={styles["step"]}>
                <span className={resolveStepDotClassName(step, stepNum as TransferStep)}>
                  {stepNum < step ? "✓" : stepNum}
                </span>
                {stepNum < 4 ? (
                  <span
                    className={clsx(
                      styles["stepConnector"],
                      stepNum < step && styles["stepConnectorDone"],
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))}
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

      <div className={styles["body"]}>
        {failureMessage !== null ? (
          <div
            className={styles["failure"]}
            data-testid="transfer-failure-banner"
            role="alert"
          >
            <div className={styles["failureText"]}>
              <p className={styles["failureTitle"]}>{failureTitle ?? "Ошибка перевода"}</p>
              <p>{failureMessage}</p>
              <p className={styles["failureHint"]}>Исходный звонок восстановлен.</p>
            </div>
          </div>
        ) : null}

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

        {step === 1 ? (
          <section className={styles["stepSection"]}>
            <p className={styles["lineSectionTitle"]}>Кому перевести</p>
            <input
              id="transfer-target-input"
              className={styles["targetInput"]}
              data-testid="transfer-target-input"
              type="tel"
              value={targetNumber}
              placeholder="Номер для перевода"
              aria-label="Номер для перевода"
              onChange={(event) => {
                onTargetChange(event.currentTarget.value);
              }}
            />
            <button
              type="button"
              data-testid="transfer-next-step"
              className={styles["nextButton"]}
              disabled={!isTargetNumberValid}
              onClick={() => {
                setStep(2);
              }}
            >
              Далее
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className={styles["stepSection"]}>
            <p className={styles["lineSectionTitle"]}>Тип перевода</p>
            <div className={styles["typeList"]}>
              <TypeChoiceCard
                iconId="call.transfer"
                title="Слепой перевод"
                description="Звонок сразу переводится. Оператор освобождается."
                testId="control-blind-transfer"
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
              <TypeChoiceCard
                iconId="transfer.consultation"
                title="Консультативный перевод"
                description="Сначала поговорите с принимающей стороной, затем подтвердите перевод."
                testId="control-start-consultation"
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
            {!consultReady && !transferInProgress ? (
              <p className={styles["waiting"]} role="status">
                Ожидание ответа…
              </p>
            ) : null}
          </section>
        ) : null}

        {transferInProgress ? (
          <p
            className={styles["progress"]}
            data-testid="transfer-in-progress-indicator"
            role="status"
            aria-live="polite"
          >
            Перевод выполняется…
          </p>
        ) : null}

        {renderDisabledReason(
          step,
          blindTransferDisabledReason,
          startConsultationDisabledReason,
          attendedTransferDisabledReason,
          cancelTransferDisabledReason,
        )}
      </div>

      <footer className={styles["footer"]}>
        <button
          type="button"
          className={styles["footerCancel"]}
          data-testid="transfer-footer-cancel"
          disabled={cancelDisabled}
          onClick={() => {
            setStep(1);
            onCancelTransfer();
          }}
        >
          {cancelLabel}
        </button>
        {step >= 3 && consultReady && !transferInProgress ? (
          <button
            type="button"
            className={styles["footerComplete"]}
            data-testid="control-attended-transfer"
            disabled={attendedTransferDisabledReason !== null}
            title={
              attendedTransferDisabledReason === null
                ? "Завершить перевод с консультацией"
                : mapTransferDisabledReasonWithFallback(attendedTransferDisabledReason)
            }
            onClick={() => {
              setStep(4);
              onAttendedTransfer();
            }}
          >
            <AppIcon id="action.confirm" size={14} decorative />
            Завершить перевод
          </button>
        ) : null}
      </footer>
    </section>
  );
}

type TypeChoiceCardProps = Readonly<{
  iconId: "call.transfer" | "transfer.consultation";
  title: string;
  description: string;
  testId: string;
  disabledReason?: string | null;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}>;

function TypeChoiceCard({
  iconId,
  title,
  description,
  testId,
  disabledReason = null,
  onClick,
}: TypeChoiceCardProps): JSX.Element {
  const isDisabled = disabledReason !== null;

  return (
    <button
      type="button"
      className={clsx(styles["typeCard"], isDisabled && styles["typeCardDisabled"])}
      data-testid={testId}
      disabled={isDisabled}
      title={isDisabled && disabledReason ? disabledReason : title}
      onClick={onClick}
    >
      <span className={styles["typeCardTitle"]}>
        <AppIcon id={iconId} size={14} decorative />
        {title}
      </span>
      <span className={styles["typeCardDescription"]}>{description}</span>
    </button>
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
  step: TransferStep,
  blindReason: string | null,
  consultationReason: string | null,
  attendedReason: string | null,
  cancelReason: string | null,
): JSX.Element | null {
  const reason =
    step === 1
      ? null
      : step === 2
        ? (blindReason ?? consultationReason)
        : (attendedReason ?? blindReason ?? consultationReason ?? cancelReason);
  if (reason === null) {
    return null;
  }

  return (
    <p className={styles["disabledReason"]} data-testid="transfer-disabled-reason" role="status">
      {mapTransferDisabledReasonWithFallback(reason)}
    </p>
  );
}
