import { useEffect, useMemo, useState, type JSX, type MouseEvent } from "react";
import type { CallLine } from "@application/index.js";
import {
  deriveCallLineStatusLabel,
  deriveTransferTargetCandidates,
  isDialpadNumberValid,
} from "@application/index.js";
import clsx from "clsx";
import { mapTransferDisabledReasonWithFallback } from "../../helpers/mapTransferDisabledReason.js";
import { useI18n, type TranslationKey } from "../../i18n/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import dismissStyles from "../icons/iconOverlayDismiss.module.css";
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
type TransferTargetInputMode = "unset" | "number" | "session";

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
  const { t } = useI18n();
  const [step, setStep] = useState<TransferStep>(1);
  const [targetInputMode, setTargetInputMode] = useState<TransferTargetInputMode>("unset");
  const [selectedSessionCallId, setSelectedSessionCallId] = useState<string | null>(null);

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
  const transferTargetCandidates = useMemo(
    () =>
      deriveTransferTargetCandidates({
        sourceCallId: sourceLine?.callId ?? null,
        lines,
      }),
    [lines, sourceLine?.callId],
  );
  const isSessionTargetMode = targetInputMode === "session" && selectedSessionCallId !== null;
  const isNumberTargetMode = targetInputMode === "number";
  const sessionsDisabled = isNumberTargetMode;
  const numberInputDisabled = isSessionTargetMode;

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setTargetInputMode("unset");
      setSelectedSessionCallId(null);
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
  const dismissLabel =
    failureMessage !== null ? t("transfer.panel.close") : t("transfer.panel.cancelTransfer");
  const showCompleteTransfer = step >= 3 && consultReady && !transferInProgress;

  return (
    <section
      className={styles["panel"]}
      data-testid="transfer-panel"
      aria-label={t("transfer.panel.ariaLabel")}
    >
      <header className={styles["header"]}>
        <div className={styles["titleWrap"]}>
          <h2 className={styles["title"]}>{t("transfer.panel.title")}</h2>
          <ol className={styles["steps"]} aria-label={t("transfer.panel.stepsAriaLabel")}>
            {[1, 2, 3, 4].map((stepNum) => (
              <li key={stepNum} className={styles["step"]}>
                <span className={resolveStepDotClassName(step, stepNum as TransferStep)}>
                  {stepNum < step ? t("transfer.panel.stepDoneMark") : stepNum}
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
          ariaLabel={dismissLabel}
          tooltipLabel={dismissLabel}
          testId="control-cancel-transfer"
          className={dismissStyles["dismiss"]}
          disabledReason={
            cancelTransferDisabledReason === null
              ? null
              : mapTransferDisabledReasonWithFallback(cancelTransferDisabledReason)
          }
          disabled={cancelDisabled}
          onClick={() => {
            setStep(1);
            onCancelTransfer();
          }}
        />
      </header>

      <div className={clsx(styles["body"], step === 1 && styles["bodyStepTarget"])}>
        {failureMessage !== null ? (
          <div
            className={styles["failure"]}
            data-testid="transfer-failure-banner"
            role="alert"
          >
            <div className={styles["failureText"]}>
              <p className={styles["failureTitle"]}>{failureTitle ?? t("transfer.panel.failureTitle")}</p>
              <p>{failureMessage}</p>
              <p className={styles["failureHint"]}>{t("transfer.panel.failureHint")}</p>
            </div>
          </div>
        ) : null}

        {sourceLine !== null ? (
          <section className={styles["lineSection"]} data-testid="transfer-source-line">
            <p className={styles["lineSectionTitle"]}>{t("transfer.panel.sourceLineTitle")}</p>
            <div className={styles["lineCard"]}>
              <p className={styles["lineLabel"]}>{sourceLine.displayLabel}</p>
              <p className={styles["lineState"]}>
                {deriveCallLineStatusLabel({ state: sourceLine.state })}
              </p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className={styles["stepSectionTarget"]}>
            <p className={styles["lineSectionTitle"]}>{t("transfer.panel.targetTitle")}</p>
            <input
              id="transfer-target-input"
              className={clsx(
                styles["targetInput"],
                numberInputDisabled && styles["targetInputDisabled"],
              )}
              data-testid="transfer-target-input"
              type="tel"
              value={targetNumber}
              placeholder={t("transfer.panel.targetPlaceholder")}
              aria-label={t("transfer.panel.targetAriaLabel")}
              disabled={numberInputDisabled}
              onChange={(event) => {
                const value = event.currentTarget.value;
                onTargetChange(value);
                setSelectedSessionCallId(null);
                setTargetInputMode(value.length > 0 ? "number" : "unset");
              }}
            />
            {transferTargetCandidates.length > 0 ? (
              <>
                <div
                  className={styles["targetDivider"]}
                  data-testid="transfer-target-divider"
                  aria-hidden="true"
                >
                  <span className={styles["targetDividerLine"]} />
                  <span className={styles["targetDividerLabel"]}>{t("transfer.panel.or")}</span>
                  <span className={styles["targetDividerLine"]} />
                </div>
                <div
                  className={clsx(
                    styles["candidateSection"],
                    sessionsDisabled && styles["candidateSectionDisabled"],
                  )}
                  data-testid="transfer-target-candidates"
                >
                  <p className={styles["candidateSectionTitle"]}>{t("transfer.panel.sessionsTitle")}</p>
                  <div className={styles["candidateScroll"]}>
                    <ul
                      className={styles["candidateList"]}
                      aria-label={t("transfer.panel.sessionSelectAriaLabel")}
                    >
                      {transferTargetCandidates.map((candidate) => {
                        const isSelected = selectedSessionCallId === candidate.callId;
                        const statusLabel = deriveCallLineStatusLabel({ state: candidate.state });
                        const displayName = candidate.displayLabel ?? candidate.remoteNumber;

                        return (
                          <li key={candidate.callId}>
                            <button
                              type="button"
                              className={clsx(
                                styles["candidateCard"],
                                isSelected && styles["candidateCardSelected"],
                              )}
                              data-testid={`transfer-target-candidate-${candidate.callId}`}
                              aria-pressed={isSelected}
                              disabled={sessionsDisabled}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSessionCallId(null);
                                  setTargetInputMode("unset");
                                  onTargetChange("");
                                  return;
                                }
                                setSelectedSessionCallId(candidate.callId);
                                setTargetInputMode("session");
                                onTargetChange(candidate.remoteNumber);
                              }}
                            >
                              <span className={styles["lineLabel"]}>{displayName}</span>
                              <span className={styles["lineState"]}>{t(statusLabel as TranslationKey)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </>
            ) : null}
            <button
              type="button"
              data-testid="transfer-next-step"
              className={styles["nextButton"]}
              disabled={!isTargetNumberValid}
              onClick={() => {
                setStep(2);
              }}
            >
              {t("transfer.panel.next")}
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className={styles["stepSection"]}>
            <p className={styles["lineSectionTitle"]}>{t("transfer.panel.typeTitle")}</p>
            <div className={styles["typeList"]}>
              <TypeChoiceCard
                iconId="call.transfer"
                title={t("transfer.panel.blind.title")}
                description={t("transfer.panel.blind.description")}
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
                title={t("transfer.panel.consultative.title")}
                description={t("transfer.panel.consultative.description")}
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
            <p className={styles["lineSectionTitle"]}>{t("transfer.panel.consultationLineTitle")}</p>
            <div className={styles["lineCard"]}>
              <p className={styles["lineLabel"]}>{consultationLine.displayLabel}</p>
              <p className={styles["lineState"]}>
                {deriveCallLineStatusLabel({ state: consultationLine.state })}
              </p>
            </div>
            {!consultReady && !transferInProgress ? (
              <p className={styles["waiting"]} role="status">
                {t("transfer.panel.waitingAnswer")}
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
            {t("transfer.panel.inProgress")}
          </p>
        ) : null}

        {renderDisabledReason(
          step,
          transferInProgress,
          blindTransferDisabledReason,
          startConsultationDisabledReason,
          attendedTransferDisabledReason,
        )}
      </div>

      {showCompleteTransfer ? (
        <footer className={styles["footer"]}>
          <button
            type="button"
            className={styles["footerComplete"]}
            data-testid="control-attended-transfer"
            disabled={attendedTransferDisabledReason !== null}
            title={
              attendedTransferDisabledReason === null
                ? t("transfer.panel.completeWithConsultation")
                : mapTransferDisabledReasonWithFallback(attendedTransferDisabledReason)
            }
            onClick={() => {
              setStep(4);
              onAttendedTransfer();
            }}
          >
            <AppIcon id="action.confirm" size={14} decorative />
            {t("transfer.panel.complete")}
          </button>
        </footer>
      ) : null}
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
  transferInProgress: boolean,
  blindReason: string | null,
  consultationReason: string | null,
  attendedReason: string | null,
): JSX.Element | null {
  if (transferInProgress) {
    return null;
  }

  const reason =
    step === 1
      ? null
      : step === 2
        ? (blindReason ?? consultationReason)
        : (attendedReason ?? consultationReason);

  if (reason === null || reason === "transfer_in_progress") {
    return null;
  }

  return (
    <p className={styles["disabledReason"]} data-testid="transfer-disabled-reason" role="status">
      {mapTransferDisabledReasonWithFallback(reason)}
    </p>
  );
}
