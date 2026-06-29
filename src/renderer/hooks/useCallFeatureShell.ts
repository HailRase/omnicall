import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveActiveCallControlsShell,
  deriveAuthShellFlags,
  deriveResumeMultiCallDisabledReason,
  type CallLineCardViewModel,
} from "@application/index.js";
import { mapActiveCallControlDisabledReason } from "../helpers/mapActiveCallControlLabels.js";
import { useTransferActions, useTransferPanelShell } from "./useTransferActions.js";
import { useTransferSuccessCelebration } from "./useTransferSuccessCelebration.js";
import { useCallLinesActions } from "./useCallLinesActions.js";
import { useCallLineRowShell } from "./useCallLineRowShell.js";
import { useIncomingCallShell } from "./useIncomingCallShell.js";
import { useCampaignActions } from "./useCampaignActions.js";
import { useDialpadShell } from "./useDialpadShell.js";
import { useSoftphoneCallActions } from "./useSoftphoneCallActions.js";
import { useIncomingCallActions } from "./useIncomingCallActions.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseCallFeatureShellInput = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: bind call feature projections, shell derivations, and action handlers.
 * - Inputs: account bootstrap facade.
 * - Outputs: zone-ready props for context, controls, and overlay shells.
 */
export function useCallFeatureShell({ facade }: UseCallFeatureShellInput) {
  const {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    queueInfoProjection,
    campaignProjection,
    multiCallProjection,
    transferProjection,
    multiLineCallProjection,
    setCallMode,
    setIncomingUiState,
  } = useSoftphoneProjections();

  const {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    inputDisabledReason,
  } = useDialpadShell(projection, callProjection, multiCallProjection);

  const callActions = useSoftphoneCallActions({
    facade,
    callProjection,
    activeCallControlsProjection,
    dialedNumber,
    callDisabledReason,
  });

  const incomingCallActions = useIncomingCallActions({
    facade,
    incomingCallProjection,
    multiCallProjection,
    isSipRegistered: deriveAuthShellFlags(projection).isSipRegistered,
    setIncomingUiState,
  });

  const incomingCallShell = useIncomingCallShell({
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    queueInfoProjection,
  });

  const campaignActions = useCampaignActions({
    facade,
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    campaignProjection,
  });

  const transferPanelShell = useTransferPanelShell({
    transferProjection,
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
  });

  const transferActions = useTransferActions({
    facade,
    sourceCallId: transferPanelShell.sourceCallId,
    consultationCallId: transferPanelShell.consultationCallId,
    targetNumber: transferPanelShell.targetNumber,
    blindTransferDisabledReason: transferPanelShell.blindTransferDisabledReason,
    startConsultationDisabledReason: transferPanelShell.startConsultationDisabledReason,
    attendedTransferDisabledReason: transferPanelShell.attendedTransferDisabledReason,
    cancelTransferDisabledReason: transferPanelShell.cancelTransferDisabledReason,
    dismissFailureBanner: transferPanelShell.dismissFailureBanner,
  });

  const transferSuccessCelebration = useTransferSuccessCelebration({
    eventPublisher: facade.eventPublisher,
    incomingCallVisible: incomingCallProjection.visible,
  });

  const activeCallControlsShell = useMemo(
    () => deriveActiveCallControlsShell(activeCallControlsProjection, transferProjection),
    [activeCallControlsProjection, transferProjection],
  );

  const callLinesShell = useCallLineRowShell({
    multiLineCallProjection,
    multiCallProjection,
    queueInfoProjection,
    activeCallControlsProjection,
    transferProjection,
    isOcpMode: projection.isOcpMode,
  });
  const callLinesActions = useCallLinesActions({ facade, shell: callLinesShell });

  const handleTransferLine = (callId: string): void => {
    const line = callLinesShell.lines.find((entry) => entry.callId === callId);
    if (line?.isActiveUnheld !== true) {
      return;
    }
    transferActions.handleStartTransfer(callId);
  };

  const combinedResumeDisabledReason = useMemo(() => {
    const multiCallReason = deriveResumeMultiCallDisabledReason(multiCallProjection);
    if (multiCallReason !== null) {
      return multiCallReason;
    }
    const controlReason = activeCallControlsProjection.resumeDisabledReason;
    return controlReason === null
      ? null
      : mapActiveCallControlDisabledReason(controlReason);
  }, [activeCallControlsProjection.resumeDisabledReason, multiCallProjection]);

  const [numberEntryOverlayOpen, setNumberEntryOverlayOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCallId === null) {
      return;
    }
    const stillExists = callLinesShell.lines.some((line) => line.callId === selectedCallId);
    if (!stillExists) {
      setSelectedCallId(null);
    }
  }, [callLinesShell.lines, selectedCallId]);

  const hasEstablishedCall = callLinesShell.lines.some(
    (line) => line.state === "Active" || line.state === "Held",
  );

  const hasCallInProgress = callLinesShell.visible || isCalling;

  const controlTargetLine = useMemo((): CallLineCardViewModel | null => {
    const { lines } = callLinesShell;
    if (selectedCallId !== null) {
      const selected = lines.find((line) => line.callId === selectedCallId);
      if (selected !== undefined) {
        return selected;
      }
    }
    const unheld = lines.find((line) => line.isActiveUnheld);
    if (unheld !== undefined) {
      return unheld;
    }
    const connecting = lines.find((line) => line.state === "Connecting");
    if (connecting !== undefined) {
      return connecting;
    }
    const ringing = lines.find((line) => line.state === "Ringing");
    if (ringing !== undefined) {
      return ringing;
    }
    return (
      lines.find((line) => line.state === "Active" || line.state === "Held") ?? null
    );
  }, [callLinesShell, selectedCallId]);

  const selectCallLine = useCallback(
    (callId: string): void => {
      const line = callLinesShell.lines.find((entry) => entry.callId === callId);
      if (line === undefined) {
        return;
      }
      if (line.primaryAction === "answer") {
        callLinesActions.handleAnswerLine(callId);
        return;
      }
      setSelectedCallId(callId);
    },
    [callLinesActions, callLinesShell.lines],
  );

  const handleDialpadCall = useCallback((): void => {
    callActions.handleDialpadCall();
    clearDialedNumber();
    if (numberEntryOverlayOpen) {
      setNumberEntryOverlayOpen(false);
    }
  }, [callActions, clearDialedNumber, numberEntryOverlayOpen]);

  const openNumberEntryOverlay = useCallback((): void => {
    setNumberEntryOverlayOpen(true);
  }, []);

  const closeNumberEntryOverlay = useCallback((): void => {
    setNumberEntryOverlayOpen(false);
    clearDialedNumber();
  }, [clearDialedNumber]);

  return {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    multiCallProjection,
    multiLineCallProjection,
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    inputDisabledReason,
    callActions,
    incomingCallActions,
    incomingCallShell,
    campaignActions,
    transferPanelShell,
    transferActions,
    transferSuccessCelebration,
    activeCallControlsShell,
    callLinesShell,
    callLinesActions,
    handleTransferLine,
    combinedResumeDisabledReason,
    setCallMode,
    hasEstablishedCall,
    hasCallInProgress,
    controlTargetLine,
    selectCallLine,
    numberEntryOverlayOpen,
    openNumberEntryOverlay,
    closeNumberEntryOverlay,
    handleDialpadCall,
  };
}

export type CallFeatureShellBindings = ReturnType<typeof useCallFeatureShell>;
