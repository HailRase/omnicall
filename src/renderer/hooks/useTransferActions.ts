import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ActiveCallControlsProjection,
  MultiCallProjection,
  MultiLineCallProjection,
  TransferProjection,
} from "@application/index.js";
import {
  deriveAttendedTransferDisabledReason,
  deriveBlindTransferDisabledReason,
  deriveStartConsultationDisabledReason,
  isTransferInProgress,
  isTransferPanelVisible,
  resolveTransferFailureBanner,
} from "@application/index.js";
import { useTransferFailureBanner } from "./useTransferFailureBanner.js";

type UseTransferPanelShellInput = Readonly<{
  transferProjection: TransferProjection;
  multiLineCallProjection: MultiLineCallProjection;
  multiCallProjection: MultiCallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
}>;

type UseTransferPanelShellResult = Readonly<{
  visible: boolean;
  targetNumber: string;
  setTargetNumber: (value: string) => void;
  blindTransferDisabledReason: string | null;
  startConsultationDisabledReason: string | null;
  attendedTransferDisabledReason: string | null;
  cancelTransferDisabledReason: string | null;
  transferInProgress: boolean;
  failureTitle: string | null;
  failureMessage: string | null;
  dismissFailureBanner: () => void;
  sourceCallId: string | null;
  consultationCallId: string | null;
}>;

/**
 * - Purpose: derive transfer panel presentation state from store projections.
 * - Inputs: transfer, multi-line, multi-call, and active call projections.
 * - Outputs: panel visibility, disabled reasons, and local target input state.
 */
export function useTransferPanelShell(
  input: UseTransferPanelShellInput,
): UseTransferPanelShellResult {
  const {
    transferProjection,
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
  } = input;
  const [targetNumber, setTargetNumber] = useState("");
  const wasTransferModeActive = useRef(false);

  useEffect(() => {
    const active = transferProjection.transferModeActive;
    if (active && !wasTransferModeActive.current) {
      setTargetNumber("");
    }
    if (!active && wasTransferModeActive.current) {
      setTargetNumber("");
    }
    wasTransferModeActive.current = active;
  }, [transferProjection.transferModeActive]);

  useEffect(() => {
    if (
      transferProjection.phase === "transferred" ||
      transferProjection.phase === "consultation_dialing" ||
      transferProjection.phase === "transferring"
    ) {
      setTargetNumber("");
    }
  }, [transferProjection.phase]);

  const transferInProgress = isTransferInProgress(transferProjection);
  const sourceCallId =
    transferProjection.sourceCallId ??
    multiLineCallProjection.sourceCallId ??
    activeCallControlsProjection.callId;
  const consultationCallId =
    transferProjection.consultationCallId ?? multiLineCallProjection.consultationCallId;

  const sourceLine = multiLineCallProjection.lines.find(
    (line) => line.callId === sourceCallId,
  );
  const consultationLine = multiLineCallProjection.lines.find(
    (line) => line.callId === consultationCallId,
  );

  const blindTransferDisabledReason = useMemo(
    () =>
      deriveBlindTransferDisabledReason({
        callId: sourceCallId,
        callState: sourceLine?.state ?? activeCallControlsProjection.callState,
        targetNumber,
        transferInProgress,
      }),
    [
      sourceCallId,
      sourceLine?.state,
      activeCallControlsProjection.callState,
      targetNumber,
      transferInProgress,
    ],
  );

  const startConsultationDisabledReason = useMemo(
    () =>
      deriveStartConsultationDisabledReason({
        sourceCallId,
        sourceCallState: sourceLine?.state ?? activeCallControlsProjection.callState,
        consultationCallId,
        targetNumber,
        multiSessionsEnabled: multiCallProjection.multiSessionsEnabled,
        autoUnholdOnTransferFailure: multiCallProjection.autoUnholdOnTransferFailure,
        attendedPhase: multiLineCallProjection.attendedPhase,
        transferInProgress,
      }),
    [
      sourceCallId,
      sourceLine?.state,
      activeCallControlsProjection.callState,
      consultationCallId,
      targetNumber,
      multiCallProjection.multiSessionsEnabled,
      multiCallProjection.autoUnholdOnTransferFailure,
      multiLineCallProjection.attendedPhase,
      transferInProgress,
    ],
  );

  const attendedTransferDisabledReason = useMemo(
    () =>
      deriveAttendedTransferDisabledReason({
        sourceCallId,
        consultationCallId,
        sourceCallState: sourceLine?.state ?? "Held",
        consultationCallState: consultationLine?.state ?? "Idle",
        attendedPhase: multiLineCallProjection.attendedPhase,
        transferInProgress,
      }),
    [
      sourceCallId,
      consultationCallId,
      sourceLine?.state,
      consultationLine?.state,
      multiLineCallProjection.attendedPhase,
      transferInProgress,
    ],
  );

  const cancelTransferDisabledReason = transferInProgress ? "transfer_in_progress" : null;

  const resolvedFailureBanner = resolveTransferFailureBanner(
    transferProjection,
    multiLineCallProjection.lastFailureReason,
  );
  const failureKey =
    resolvedFailureBanner === null
      ? null
      : `${resolvedFailureBanner.detail}|${transferProjection.phase}|${multiLineCallProjection.lastFailureReason ?? ""}`;
  const { failureBannerMessage, dismissFailureBanner } = useTransferFailureBanner({
    failureMessage: resolvedFailureBanner?.detail ?? null,
    failureKey,
    transferInProgress,
  });

  return {
    visible: isTransferPanelVisible(transferProjection, {
      attendedPhase: multiLineCallProjection.attendedPhase,
      consultationCallId: multiLineCallProjection.consultationCallId,
    }),
    targetNumber,
    setTargetNumber,
    blindTransferDisabledReason,
    startConsultationDisabledReason,
    attendedTransferDisabledReason,
    cancelTransferDisabledReason,
    transferInProgress,
    failureTitle: resolvedFailureBanner?.title ?? null,
    failureMessage: failureBannerMessage,
    dismissFailureBanner,
    sourceCallId,
    consultationCallId,
  };
}

type UseTransferActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sourceCallId: string | null;
  consultationCallId: string | null;
  targetNumber: string;
  blindTransferDisabledReason: string | null;
  startConsultationDisabledReason: string | null;
  attendedTransferDisabledReason: string | null;
  cancelTransferDisabledReason: string | null;
  dismissFailureBanner: () => void;
}>;

type UseTransferActionsResult = Readonly<{
  handleStartTransfer: (callId: string) => void;
  handleBlindTransfer: () => void;
  handleStartConsultation: () => void;
  handleAttendedTransfer: () => void;
  handleCancelTransfer: () => void;
}>;

/**
 * - Purpose: bind transfer panel UI intents to AccountBootstrapFacade methods.
 * - Inputs: facade, projection ids, disabled reasons, and target number.
 * - Outputs: callback handlers for transfer panel actions.
 */
export function useTransferActions(
  input: UseTransferActionsInput,
): UseTransferActionsResult {
  const {
    facade,
    sourceCallId,
    consultationCallId,
    targetNumber,
    blindTransferDisabledReason,
    startConsultationDisabledReason,
    attendedTransferDisabledReason,
    cancelTransferDisabledReason,
    dismissFailureBanner,
  } = input;

  const handleStartTransfer = (callId: string): void => {
    if (facade === null || callId.length === 0) {
      return;
    }
    facade.startTransferById(callId);
  };

  const handleBlindTransfer = (): void => {
    if (facade === null || sourceCallId === null || blindTransferDisabledReason !== null) {
      return;
    }
    dismissFailureBanner();
    void facade.blindTransferById(sourceCallId, targetNumber);
  };

  const handleStartConsultation = (): void => {
    if (
      facade === null ||
      sourceCallId === null ||
      startConsultationDisabledReason !== null
    ) {
      return;
    }
    dismissFailureBanner();
    void facade.startConsultationByIds(sourceCallId, targetNumber);
  };

  const handleAttendedTransfer = (): void => {
    if (
      facade === null ||
      sourceCallId === null ||
      consultationCallId === null ||
      attendedTransferDisabledReason !== null
    ) {
      return;
    }
    dismissFailureBanner();
    void facade.attendedTransferByIds(sourceCallId, consultationCallId);
  };

  const handleCancelTransfer = (): void => {
    if (facade === null || sourceCallId === null || cancelTransferDisabledReason !== null) {
      return;
    }
    void facade.cancelTransferById(sourceCallId);
  };

  return {
    handleStartTransfer,
    handleBlindTransfer,
    handleStartConsultation,
    handleAttendedTransfer,
    handleCancelTransfer,
  };
}
