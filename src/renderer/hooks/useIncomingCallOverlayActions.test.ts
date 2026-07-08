// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  initialIncomingCallProjection,
  initialTransferProjection,
  type IncomingCallProjection,
} from "@application/index.js";
import { useIncomingCallOverlayActions } from "./useIncomingCallOverlayActions.js";

function createIncomingActions() {
  return {
    handleAnswerIncoming: vi.fn(),
    handleRejectIncoming: vi.fn(),
    answerDisabledReason: null,
    rejectDisabledReason: null,
  };
}

function createTransferPanelShell() {
  return {
    visible: false,
    targetNumber: "",
    setTargetNumber: vi.fn(),
    blindTransferDisabledReason: null,
    startConsultationDisabledReason: null,
    attendedTransferDisabledReason: null,
    cancelTransferDisabledReason: null,
    transferInProgress: false,
    failureTitle: null,
    failureMessage: null,
    dismissFailureBanner: vi.fn(),
    sourceCallId: "source-1",
    consultationCallId: null,
  };
}

function createTransferActions() {
  return {
    handleStartTransfer: vi.fn(),
    handleBlindTransfer: vi.fn(),
    handleStartConsultation: vi.fn(),
    handleAttendedTransfer: vi.fn(),
    handleCancelTransfer: vi.fn(),
  };
}

describe("useIncomingCallOverlayActions", () => {
  it("body navigation goes to dialpad without answer", () => {
    const goToDialpad = vi.fn();
    const closeSettings = vi.fn();
    const setCallMode = vi.fn();
    const closeNumberEntryOverlay = vi.fn();
    const selectIncomingCall = vi.fn();
    const incomingCallActions = createIncomingActions();

    const { result } = renderHook(() =>
      useIncomingCallOverlayActions({
        incomingCallProjection: {
          ...initialIncomingCallProjection(),
          visible: true,
          callId: "call-a",
          uiState: "incomingRinging",
        },
        incomingCallActions,
        transferProjection: initialTransferProjection(),
        transferPanelShell: createTransferPanelShell(),
        transferActions: createTransferActions(),
        settingsOpen: true,
        closeSettings,
        goToDialpad,
        setCallMode,
        closeNumberEntryOverlay,
        selectIncomingCall,
      }),
    );

    act(() => {
      result.current.handleOpenCallSurface();
    });

    expect(goToDialpad).toHaveBeenCalledTimes(1);
    expect(closeSettings).toHaveBeenCalledTimes(1);
    expect(setCallMode).toHaveBeenCalledWith("number");
    expect(closeNumberEntryOverlay).toHaveBeenCalledTimes(1);
    expect(selectIncomingCall).toHaveBeenCalledTimes(1);
    expect(incomingCallActions.handleAnswerIncoming).not.toHaveBeenCalled();
  });

  it("reject delegates to incoming actions without navigation", () => {
    const goToDialpad = vi.fn();
    const incomingCallActions = createIncomingActions();

    const { result } = renderHook(() =>
      useIncomingCallOverlayActions({
        incomingCallProjection: {
          ...initialIncomingCallProjection(),
          visible: true,
          callId: "call-a",
          uiState: "incomingRinging",
        },
        incomingCallActions,
        transferProjection: initialTransferProjection(),
        transferPanelShell: createTransferPanelShell(),
        transferActions: createTransferActions(),
        settingsOpen: false,
        closeSettings: vi.fn(),
        goToDialpad,
        setCallMode: vi.fn(),
        closeNumberEntryOverlay: vi.fn(),
        selectIncomingCall: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleReject();
    });

    expect(incomingCallActions.handleRejectIncoming).toHaveBeenCalledTimes(1);
    expect(goToDialpad).not.toHaveBeenCalled();
  });

  it("answer delegates to incoming actions", () => {
    const incomingCallActions = createIncomingActions();

    const { result } = renderHook(() =>
      useIncomingCallOverlayActions({
        incomingCallProjection: {
          ...initialIncomingCallProjection(),
          visible: true,
          callId: "call-a",
          uiState: "incomingRinging",
        },
        incomingCallActions,
        transferProjection: initialTransferProjection(),
        transferPanelShell: createTransferPanelShell(),
        transferActions: createTransferActions(),
        settingsOpen: false,
        closeSettings: vi.fn(),
        goToDialpad: vi.fn(),
        setCallMode: vi.fn(),
        closeNumberEntryOverlay: vi.fn(),
        selectIncomingCall: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleAnswer();
    });

    expect(incomingCallActions.handleAnswerIncoming).toHaveBeenCalledTimes(1);
  });

  it("navigates to main after successful answer", async () => {
    const goToDialpad = vi.fn();
    let projection: IncomingCallProjection = {
      ...initialIncomingCallProjection(),
      visible: true,
      callId: "call-a",
      uiState: "incomingRinging",
    };

    const { rerender } = renderHook(() =>
      useIncomingCallOverlayActions({
        incomingCallProjection: projection,
        incomingCallActions: createIncomingActions(),
        transferProjection: initialTransferProjection(),
        transferPanelShell: createTransferPanelShell(),
        transferActions: createTransferActions(),
        settingsOpen: false,
        closeSettings: vi.fn(),
        goToDialpad,
        setCallMode: vi.fn(),
        closeNumberEntryOverlay: vi.fn(),
        selectIncomingCall: vi.fn(),
      }),
    );

    projection = { ...projection, uiState: "answering" };
    rerender();

    projection = initialIncomingCallProjection();
    rerender();

    await waitFor(() => {
      expect(goToDialpad).toHaveBeenCalledTimes(1);
    });
  });

  it("closes transfer target selection UI mode on answer navigation", async () => {
    const cancelTransfer = vi.fn();
    const transferActions = {
      ...createTransferActions(),
      handleCancelTransfer: cancelTransfer,
    };
    let projection: IncomingCallProjection = {
      ...initialIncomingCallProjection(),
      visible: true,
      callId: "call-a",
      uiState: "incomingRinging",
    };

    const { rerender } = renderHook(() =>
      useIncomingCallOverlayActions({
        incomingCallProjection: projection,
        incomingCallActions: createIncomingActions(),
        transferProjection: {
          ...initialTransferProjection(),
          transferModeActive: true,
          phase: "idle",
          sourceCallId: "source-1",
        },
        transferPanelShell: {
          ...createTransferPanelShell(),
          visible: true,
          transferInProgress: false,
        },
        transferActions,
        settingsOpen: false,
        closeSettings: vi.fn(),
        goToDialpad: vi.fn(),
        setCallMode: vi.fn(),
        closeNumberEntryOverlay: vi.fn(),
        selectIncomingCall: vi.fn(),
      }),
    );

    projection = { ...projection, uiState: "answering" };
    rerender();

    projection = initialIncomingCallProjection();
    rerender();

    await waitFor(() => {
      expect(cancelTransfer).toHaveBeenCalledTimes(1);
    });
  });
});
