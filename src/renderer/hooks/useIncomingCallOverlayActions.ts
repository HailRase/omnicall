import { useCallback, useEffect, useRef } from "react";
import type { IncomingCallProjection, TransferProjection } from "@application/index.js";

type IncomingCallActionsSlice = Readonly<{
  handleAnswerIncoming: () => void;
  handleAnswerIncomingWithVideo: () => void;
  handleRejectIncoming: () => void;
}>;

type TransferPanelShellSlice = Readonly<{
  transferInProgress: boolean;
  consultationCallId: string | null;
}>;

type TransferActionsSlice = Readonly<{
  handleCancelTransfer: () => void;
}>;

type UseIncomingCallOverlayActionsInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
  incomingCallActions: IncomingCallActionsSlice;
  transferProjection: TransferProjection;
  transferPanelShell: TransferPanelShellSlice;
  transferActions: TransferActionsSlice;
  settingsOpen: boolean;
  closeSettings: () => void;
  goToDialpad: () => void;
  setCallMode: (mode: "number" | "dtmf", dtmfPanelCallId?: string | null) => void;
  closeNumberEntryOverlay: () => void;
  selectIncomingCall: () => void;
  exitVideoFullscreen: () => void;
}>;

type UseIncomingCallOverlayActionsResult = Readonly<{
  handleOpenCallSurface: () => void;
  handleAnswer: () => void;
  handleAnswerWithVideo: () => void;
  handleReject: () => void;
}>;

/**
 * - Purpose: orchestrate incoming overlay navigation and conflicting shell UI cleanup.
 * - Inputs: incoming actions, transfer shell state, and navigation callbacks.
 * - Outputs: overlay body navigation and answer/reject handlers with post-answer routing.
 */
export function useIncomingCallOverlayActions(
  input: UseIncomingCallOverlayActionsInput,
): UseIncomingCallOverlayActionsResult {
  const {
    incomingCallProjection,
    incomingCallActions,
    transferProjection,
    transferPanelShell,
    transferActions,
    settingsOpen,
    closeSettings,
    goToDialpad,
    setCallMode,
    closeNumberEntryOverlay,
    selectIncomingCall,
    exitVideoFullscreen,
  } = input;

  const wasAnsweringRef = useRef(false);

  const focusMainCallSurface = useCallback((): void => {
    exitVideoFullscreen();
    goToDialpad();
    if (settingsOpen) {
      closeSettings();
    }
    setCallMode("number");
    closeNumberEntryOverlay();
    if (shouldCloseTransferTargetSelection(transferProjection, transferPanelShell)) {
      transferActions.handleCancelTransfer();
    }
    selectIncomingCall();
  }, [
    closeNumberEntryOverlay,
    closeSettings,
    exitVideoFullscreen,
    goToDialpad,
    selectIncomingCall,
    setCallMode,
    settingsOpen,
    transferActions,
    transferPanelShell,
    transferProjection,
  ]);

  useEffect(() => {
    if (incomingCallProjection.uiState === "answering") {
      wasAnsweringRef.current = true;
      return;
    }

    if (incomingCallProjection.uiState === "answerFailed") {
      wasAnsweringRef.current = false;
      return;
    }

    if (wasAnsweringRef.current && !incomingCallProjection.visible) {
      wasAnsweringRef.current = false;
      focusMainCallSurface();
    }
  }, [
    focusMainCallSurface,
    incomingCallProjection.uiState,
    incomingCallProjection.visible,
  ]);

  const handleOpenCallSurface = useCallback((): void => {
    focusMainCallSurface();
  }, [focusMainCallSurface]);

  const handleAnswer = useCallback((): void => {
    incomingCallActions.handleAnswerIncoming();
  }, [incomingCallActions]);

  const handleAnswerWithVideo = useCallback((): void => {
    incomingCallActions.handleAnswerIncomingWithVideo();
  }, [incomingCallActions]);

  const handleReject = useCallback((): void => {
    incomingCallActions.handleRejectIncoming();
  }, [incomingCallActions]);

  return {
    handleOpenCallSurface,
    handleAnswer,
    handleAnswerWithVideo,
    handleReject,
  };
}

function shouldCloseTransferTargetSelection(
  transferProjection: TransferProjection,
  transferPanelShell: TransferPanelShellSlice,
): boolean {
  if (!transferProjection.transferModeActive) {
    return false;
  }
  if (transferPanelShell.transferInProgress) {
    return false;
  }
  if (transferPanelShell.consultationCallId !== null) {
    return false;
  }
  return transferProjection.phase === "idle" || transferProjection.phase === "transfer_failed";
}
