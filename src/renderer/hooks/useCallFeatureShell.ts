import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  buildContactDirectory,
  deriveActiveCallControlsShell,
  deriveAuthShellFlags,
  deriveCallControlTarget,
  deriveIncomingCallSessionCardVisible,
  deriveResumeMultiCallDisabledReason,
  resolveOutgoingInProgressCallId,
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
import { applyHeadsetSyncBusyToActiveCallControls, applyHeadsetSyncBusyToCallLine } from "@application/projections/headset/applyHeadsetSyncBusyToActiveCallControls.js";

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

  const headsetSyncBusyProjection = useAccountBootstrapStore(
    (state) => state.headsetSyncBusyProjection,
  );
  const adjustedActiveCallControlsProjection = useMemo(
    () =>
      applyHeadsetSyncBusyToActiveCallControls(
        activeCallControlsProjection,
        headsetSyncBusyProjection,
      ),
    [activeCallControlsProjection, headsetSyncBusyProjection],
  );

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
    activeCallControlsProjection: adjustedActiveCallControlsProjection,
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
    () => deriveActiveCallControlsShell(adjustedActiveCallControlsProjection, transferProjection),
    [adjustedActiveCallControlsProjection, transferProjection],
  );

  const incomingCallId =
    incomingCallProjection.visible && incomingCallProjection.callId !== null
      ? incomingCallProjection.callId
      : null;

  const callLinesShell = useCallLineRowShell({
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection: adjustedActiveCallControlsProjection,
    transferProjection,
    contacts,
    incomingCallId,
  });
  const callLinesShellWithSyncBusy = useMemo(
    () => ({
      ...callLinesShell,
      lines: callLinesShell.lines.map((line) =>
        applyHeadsetSyncBusyToCallLine(line, headsetSyncBusyProjection),
      ),
    }),
    [callLinesShell, headsetSyncBusyProjection],
  );
  const callLinesActions = useCallLinesActions({
    facade,
    shell: callLinesShellWithSyncBusy,
  });

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
  const trackedOutgoingCallIdRef = useRef<string | null>(null);
  const preOutgoingSelectionRef = useRef<string | null>(null);
  const userSelectedCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Incoming UI selection wins over outgoing auto-select while ringing.
    if (incomingCallId !== null) {
      return;
    }

    const outgoingCallId = resolveOutgoingInProgressCallId({
      lines: callLinesShell.lines,
      incomingCallId,
    });

    if (outgoingCallId === null) {
      const endedOutgoingId = trackedOutgoingCallIdRef.current;
      trackedOutgoingCallIdRef.current = null;
      if (endedOutgoingId === null) {
        return;
      }

      const establishedOutgoing = callLinesShell.lines.find(
        (line) =>
          line.callId === endedOutgoingId &&
          (line.state === "Active" || line.state === "Held"),
      );
      if (establishedOutgoing !== undefined) {
        userSelectedCallIdRef.current = endedOutgoingId;
        setSelectedCallId(endedOutgoingId);
        preOutgoingSelectionRef.current = null;
        return;
      }

      const previousSelection = preOutgoingSelectionRef.current;
      preOutgoingSelectionRef.current = null;
      if (
        previousSelection !== null &&
        callLinesShell.lines.some((line) => line.callId === previousSelection)
      ) {
        userSelectedCallIdRef.current = previousSelection;
        setSelectedCallId(previousSelection);
      }
      return;
    }

    const isNewOutgoing = trackedOutgoingCallIdRef.current !== outgoingCallId;
    trackedOutgoingCallIdRef.current = outgoingCallId;
    if (!isNewOutgoing) {
      return;
    }
    if (userSelectedCallIdRef.current !== outgoingCallId) {
      preOutgoingSelectionRef.current = userSelectedCallIdRef.current;
    }
    userSelectedCallIdRef.current = outgoingCallId;
    setSelectedCallId(outgoingCallId);
  }, [callLinesShell.lines, incomingCallId]);

  useEffect(() => {
    if (incomingCallId === null) {
      const endedIncomingId = trackedIncomingCallIdRef.current;
      trackedIncomingCallIdRef.current = null;
      if (endedIncomingId === null) {
        return;
      }

      // Answered incoming becomes established — keep headset/UI focus on it (Q6=A).
      const answeredLine = callLinesShell.lines.find(
        (line) =>
          line.callId === endedIncomingId &&
          (line.state === "Active" ||
            line.state === "Held" ||
            line.state === "Connecting"),
      );
      if (answeredLine !== undefined) {
        userSelectedCallIdRef.current = endedIncomingId;
        setSelectedCallId(endedIncomingId);
        return;
      }

      // Rejected/missed — restore pre-incoming operator selection when still alive.
      const previousUserSelection = userSelectedCallIdRef.current;
      if (previousUserSelection !== null) {
        const lineStillExists = callLinesShell.lines.some(
          (line) => line.callId === previousUserSelection,
        );
        if (lineStillExists) {
          setSelectedCallId(previousUserSelection);
          return;
        }
        userSelectedCallIdRef.current = null;
      }
      return;
    }
    const isNewIncoming = trackedIncomingCallIdRef.current !== incomingCallId;
    trackedIncomingCallIdRef.current = incomingCallId;
    if (!isNewIncoming) {
      return;
    }
    setSelectedCallId(incomingCallId);
  }, [callLinesShell.lines, incomingCallId]);

  useEffect(() => {
    if (selectedCallId === null) {
      return;
    }
    const lineStillExists = callLinesShell.lines.some((line) => line.callId === selectedCallId);
    const incomingStillExists = incomingCallId === selectedCallId;
    if (!lineStillExists && !incomingStillExists) {
      const previousUserSelection = userSelectedCallIdRef.current;
      if (
        previousUserSelection !== null &&
        previousUserSelection !== selectedCallId &&
        callLinesShell.lines.some((line) => line.callId === previousUserSelection)
      ) {
        setSelectedCallId(previousUserSelection);
        return;
      }
      setSelectedCallId(null);
    }
  }, [callLinesShell.lines, incomingCallId, selectedCallId]);

  useEffect(() => {
    facade.setHeadsetSelectedCallId(userSelectedCallIdRef.current);
  }, [facade, selectedCallId]);

  const hasEstablishedCall = callLinesShellWithSyncBusy.lines.some(
    (line) => line.state === "Active" || line.state === "Held",
  );

  const hasCallInProgress =
    callLinesShellWithSyncBusy.visible || isCalling || incomingCallProjection.visible;

  const nonIncomingLines = useMemo(
    () =>
      incomingCallId === null
        ? callLinesShellWithSyncBusy.lines
        : callLinesShellWithSyncBusy.lines.filter((line) => line.callId !== incomingCallId),
    [callLinesShellWithSyncBusy.lines, incomingCallId],
  );

  const nonIncomingLinesShell = useMemo(
    () => ({
      ...callLinesShellWithSyncBusy,
      lines: nonIncomingLines,
      visible: nonIncomingLines.length >= 1,
    }),
    [callLinesShellWithSyncBusy, nonIncomingLines],
  );

  const isIncomingSelected =
    incomingCallId !== null && selectedCallId === incomingCallId;

  const controlTargetLine = useMemo(() => {
    const target = deriveCallControlTarget({
      selectedCallId,
      lines: callLinesShellWithSyncBusy.lines,
      incomingCallId,
      incomingCallProjection,
      contacts,
    });
    if (target === null) {
      return null;
    }
    return applyHeadsetSyncBusyToCallLine(target, headsetSyncBusyProjection);
  }, [
    callLinesShellWithSyncBusy.lines,
    contacts,
    headsetSyncBusyProjection,
    incomingCallId,
    incomingCallProjection,
    selectedCallId,
  ]);

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
      // Incoming ringing: select without answering (answer is a separate control).
      if (
        incomingCallId !== null &&
        callId === incomingCallId &&
        line.primaryAction === "answer"
      ) {
        userSelectedCallIdRef.current = callId;
        setSelectedCallId(callId);
        return;
      }
      // Outbound Connecting/Ringing and established lines: select only.
      // Never treat outbound ringback as answer.
      if (line.primaryAction === "answer") {
        callLinesActions.handleAnswerLine(callId);
        return;
      }
      userSelectedCallIdRef.current = callId;
      setSelectedCallId(callId);
    },
    [callLinesActions, callLinesShell.lines, incomingCallId],
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

  const incomingSessionCardVisible = useMemo(
    () =>
      deriveIncomingCallSessionCardVisible({
        incomingCallId,
        transferPanelVisible: transferPanelShell.visible,
        transferSuccessCelebrationVisible: transferSuccessCelebration.visible,
        dialpadMode,
        dtmfPanelCallId: callProjection.dtmfPanelCallId,
        numberEntryOverlayOpen,
      }),
    [
      callProjection.dtmfPanelCallId,
      dialpadMode,
      incomingCallId,
      numberEntryOverlayOpen,
      transferPanelShell.visible,
      transferSuccessCelebration.visible,
    ],
  );

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
    callLinesShell: callLinesShellWithSyncBusy,
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
    incomingSessionCardVisible,
    nonIncomingLinesShell,
    numberEntryOverlayOpen,
    openNumberEntryOverlay,
    closeNumberEntryOverlay,
    handleDialpadCall,
    outgoingDisplayName,
  };
}

export type CallFeatureShellBindings = ReturnType<typeof useCallFeatureShell>;
