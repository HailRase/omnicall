import { useMemo, useState } from "react";
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
  resolveTransferFailureMessage,
} from "@application/index.js";

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
  failureMessage: string | null;
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

  return {
    visible: isTransferPanelVisible(
      transferProjection,
      multiLineCallProjection.lines.length,
    ),
    targetNumber,
    setTargetNumber,
    blindTransferDisabledReason,
    startConsultationDisabledReason,
    attendedTransferDisabledReason,
    cancelTransferDisabledReason,
    transferInProgress,
    failureMessage: resolveTransferFailureMessage(
      transferProjection,
      multiLineCallProjection.lastFailureReason,
    ),
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
  activeCallControlsProjection: ActiveCallControlsProjection;
}>;

type UseTransferActionsResult = Readonly<{
  handleStartTransfer: () => void;
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
    activeCallControlsProjection,
  } = input;

  const handleStartTransfer = (): void => {
    if (facade === null || activeCallControlsProjection.callId === null) {
      return;
    }
    if (
      activeCallControlsProjection.callState !== "Active" &&
      activeCallControlsProjection.callState !== "Held"
    ) {
      return;
    }
    facade.startTransferById(activeCallControlsProjection.callId);
  };

  const handleBlindTransfer = (): void => {
    if (facade === null || sourceCallId === null || blindTransferDisabledReason !== null) {
      return;
    }
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
