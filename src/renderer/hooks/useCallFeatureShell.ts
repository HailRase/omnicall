import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  buildContactDirectory,
  deriveActiveCallControlsShell,
  deriveAuthShellFlags,
  deriveCallControlTarget,
  deriveIncomingCallSessionCardVisible,
  deriveResumeMultiCallDisabledReason,
  resolveDialpadCallIntent,
  resolveFullscreenVideoSession,
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
import { useVideoCallActions } from "./useVideoCallActions.js";
import { useScreenSharePicker } from "./useScreenSharePicker.js";
import type { NotificationDescriptor } from "./useNotifications.js";
import {
  applyHeadsetSyncBusyToActiveCallControls,
  applyHeadsetSyncBusyToCallLine,
} from "@application/projections/headset/applyHeadsetSyncBusyToActiveCallControls.js";

type UseCallFeatureShellInput = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

/**
 * - Purpose: bind call feature projections, shell derivations, and action handlers.
 * - Inputs: account bootstrap facade and optional notification presenter.
 * - Outputs: zone-ready props for context, controls, and overlay shells.
 */
export function useCallFeatureShell({ facade, notify }: UseCallFeatureShellInput) {
  const {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    multiCallProjection,
    transferProjection,
    multiLineCallProjection,
    callVideoMediaUiProjection,
    callFocusProjection,
    setCallMode,
    setCallFocusSelection,
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
  const callHistoryEntries = useAccountBootstrapStore(
    (state) => state.callHistoryProjection.entries,
  );
  const historyRemoteNumbers = useMemo(
    () => callHistoryEntries.map((entry) => entry.remoteNumber),
    [callHistoryEntries],
  );

  const {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    walkHistoryNewer,
    walkHistoryOlder,
    applyHistoryNumber,
    historyNumbers,
    canRecallLastNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    videoCallDisabledReason,
    inputDisabledReason,
  } = useDialpadShell({
    projection,
    callProjection,
    multiCallProjection,
    historyRemoteNumbers,
  });

  const callActions = useSoftphoneCallActions({
    facade,
    callProjection,
    activeCallControlsProjection: adjustedActiveCallControlsProjection,
    dialedNumber,
    callDisabledReason,
    videoCallDisabledReason,
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
  const screenSharePicker = useScreenSharePicker({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const videoCallActions = useVideoCallActions({
    facade,
    openScreenSharePicker: screenSharePicker.openPicker,
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
  const selectedCallId = callFocusProjection.focusedCallId;

  useEffect(() => {
    facade.setHeadsetSelectedCallId(selectedCallId);
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

  const controlTargetVideoState = useMemo(() => {
    const callId = controlTargetLine?.callId;
    if (callId === undefined) {
      return null;
    }
    return callVideoMediaUiProjection.byCallId[callId] ?? null;
  }, [callVideoMediaUiProjection.byCallId, controlTargetLine?.callId]);

  const exitVideoFullscreen = useCallback((): void => {
    const session = resolveFullscreenVideoSession(callVideoMediaUiProjection.byCallId);
    if (session === null) {
      return;
    }
    videoCallActions.handleSetSessionView(session.callId, "expanded");
  }, [callVideoMediaUiProjection.byCallId, videoCallActions]);

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
        setCallFocusSelection(callId);
        return;
      }
      // Outbound Connecting/Ringing and established lines: select only.
      // Never treat outbound ringback as answer.
      if (line.primaryAction === "answer") {
        callLinesActions.handleAnswerLine(callId);
        return;
      }
      setCallFocusSelection(callId);
    },
    [callLinesActions, callLinesShell.lines, incomingCallId, setCallFocusSelection],
  );

  const selectIncomingCall = useCallback((): void => {
    if (incomingCallId !== null) {
      setCallFocusSelection(incomingCallId);
    }
  }, [incomingCallId, setCallFocusSelection]);

  const handleDialpadCall = useCallback((): void => {
    const intent = resolveDialpadCallIntent(dialedNumber, historyNumbers[0] ?? null);
    if (intent.type === "noop") {
      return;
    }
    if (intent.type === "fill") {
      applyHistoryNumber(intent.number, 0);
      return;
    }
    callActions.handleDialpadCall();
    clearDialedNumber();
    if (numberEntryOverlayOpen) {
      setNumberEntryOverlayOpen(false);
    }
  }, [
    applyHistoryNumber,
    callActions,
    clearDialedNumber,
    dialedNumber,
    historyNumbers,
    numberEntryOverlayOpen,
  ]);

  const handleDialpadVideoCall = useCallback((): void => {
    const intent = resolveDialpadCallIntent(dialedNumber, historyNumbers[0] ?? null);
    if (intent.type === "noop") {
      return;
    }
    if (intent.type === "fill") {
      applyHistoryNumber(intent.number, 0);
      return;
    }
    callActions.handleDialpadVideoCall();
    clearDialedNumber();
    if (numberEntryOverlayOpen) {
      setNumberEntryOverlayOpen(false);
    }
  }, [
    applyHistoryNumber,
    callActions,
    clearDialedNumber,
    dialedNumber,
    historyNumbers,
    numberEntryOverlayOpen,
  ]);

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
    walkHistoryNewer,
    walkHistoryOlder,
    canRecallLastNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    videoCallDisabledReason,
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
    controlTargetVideoState,
    videoCallActions,
    screenSharePicker,
    exitVideoFullscreen,
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
    handleDialpadVideoCall,
    outgoingDisplayName,
  };
}

export type CallFeatureShellBindings = ReturnType<typeof useCallFeatureShell>;
