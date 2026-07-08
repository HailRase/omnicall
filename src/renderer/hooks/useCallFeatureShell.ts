import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  buildContactDirectory,
  deriveActiveCallControlsShell,
  deriveAuthShellFlags,
  deriveCallControlTarget,
  deriveResumeMultiCallDisabledReason,
} from "@application/index.js";
import { mapActiveCallControlDisabledReason } from "../helpers/mapActiveCallControlLabels.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useTransferActions, useTransferPanelShell } from "./useTransferActions.js";
import { useTransferSuccessCelebration } from "./useTransferSuccessCelebration.js";
import { useCallLinesActions } from "./useCallLinesActions.js";
import { useCallLineRowShell } from "./useCallLineRowShell.js";
import { useIncomingCallShell } from "./useIncomingCallShell.js";
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
    multiCallProjection,
    transferProjection,
    multiLineCallProjection,
    setCallMode,
    setIncomingUiState,
  } = useSoftphoneProjections();

  const contacts = useAccountBootstrapStore((state) => state.contactsProjection.contacts);

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
    incomingCallProjection,
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
    activeCallControlsProjection,
    transferProjection,
    contacts,
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
  const trackedIncomingCallIdRef = useRef<string | null>(null);
  const userSelectedCallIdRef = useRef<string | null>(null);

  const incomingCallId =
    incomingCallProjection.visible && incomingCallProjection.callId !== null
      ? incomingCallProjection.callId
      : null;

  useEffect(() => {
    if (incomingCallId === null) {
      trackedIncomingCallIdRef.current = null;
      return;
    }
    const isNewIncoming = trackedIncomingCallIdRef.current !== incomingCallId;
    trackedIncomingCallIdRef.current = incomingCallId;
    if (!isNewIncoming) {
      return;
    }
    userSelectedCallIdRef.current = null;
    setSelectedCallId(incomingCallId);
  }, [incomingCallId]);

  useEffect(() => {
    if (selectedCallId === null) {
      return;
    }
    const lineStillExists = callLinesShell.lines.some((line) => line.callId === selectedCallId);
    const incomingStillExists = incomingCallId === selectedCallId;
    if (!lineStillExists && !incomingStillExists) {
      setSelectedCallId(null);
    }
  }, [callLinesShell.lines, incomingCallId, selectedCallId]);

  const hasEstablishedCall = callLinesShell.lines.some(
    (line) => line.state === "Active" || line.state === "Held",
  );

  const hasCallInProgress =
    callLinesShell.visible || isCalling || incomingCallProjection.visible;

  const nonIncomingLines = useMemo(
    () =>
      incomingCallId === null
        ? callLinesShell.lines
        : callLinesShell.lines.filter((line) => line.callId !== incomingCallId),
    [callLinesShell.lines, incomingCallId],
  );

  const nonIncomingLinesShell = useMemo(
    () => ({
      ...callLinesShell,
      lines: nonIncomingLines,
      visible: nonIncomingLines.length >= 1,
    }),
    [callLinesShell, nonIncomingLines],
  );

  const isIncomingSelected =
    incomingCallId !== null && selectedCallId === incomingCallId;

  const controlTargetLine = useMemo(
    () =>
      deriveCallControlTarget({
        selectedCallId,
        lines: callLinesShell.lines,
        incomingCallId,
        incomingCallProjection,
        contacts,
      }),
    [callLinesShell.lines, contacts, incomingCallId, incomingCallProjection, selectedCallId],
  );

  const outgoingDisplayName = useMemo(() => {
    const presentation = buildContactDirectory(contacts).resolvePresentation({
      remoteNumber: dialedNumber,
      displayLabel: null,
    });
    return presentation.source === "contact" ? presentation.primaryLabel : null;
  }, [contacts, dialedNumber]);

  const selectCallLine = useCallback(
    (callId: string): void => {
      const line = callLinesShell.lines.find((entry) => entry.callId === callId);
      if (line === undefined) {
        return;
      }
      if (
        incomingCallProjection.visible &&
        line.state === "Ringing" &&
        line.primaryAction === "answer"
      ) {
        userSelectedCallIdRef.current = callId;
        setSelectedCallId(callId);
        return;
      }
      if (line.primaryAction === "answer") {
        callLinesActions.handleAnswerLine(callId);
        return;
      }
      userSelectedCallIdRef.current = callId;
      setSelectedCallId(callId);
    },
    [callLinesActions, callLinesShell.lines, incomingCallProjection.visible],
  );

  const selectIncomingCall = useCallback((): void => {
    if (incomingCallId !== null) {
      userSelectedCallIdRef.current = incomingCallId;
      setSelectedCallId(incomingCallId);
    }
  }, [incomingCallId]);

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
    selectIncomingCall,
    incomingCallId,
    isIncomingSelected,
    nonIncomingLinesShell,
    numberEntryOverlayOpen,
    openNumberEntryOverlay,
    closeNumberEntryOverlay,
    handleDialpadCall,
    outgoingDisplayName,
  };
}

export type CallFeatureShellBindings = ReturnType<typeof useCallFeatureShell>;
