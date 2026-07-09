// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallControlsBar } from "./CallControlsBar.js";

afterEach(() => {
  cleanup();
});

const activeLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "call.line.status.active",
  durationStartedAt: Date.now(),
primaryAction: "hangup",
  showIconRow: true,
  showLocalHoldBadge: false,
  showRemoteHoldBadge: false,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

describe("CallControlsBar", () => {
  it("renders labeled controls for active line", () => {
    render(
      <CallControlsBar
        line={activeLine}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onShowNumberEntry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-controls-bar")).toBeInTheDocument();
    expect(screen.getByText("Удержание")).toBeInTheDocument();
    expect(screen.getByText("Тоновый набор")).toBeInTheDocument();
    expect(screen.getByText("Завершить")).toBeInTheDocument();
  });

  it("renders resume control with green styling when line is held", () => {
    const heldLine: CallLineCardViewModel = {
      ...activeLine,
      state: "Held",
      isActiveUnheld: false,
    };
    render(
      <CallControlsBar
        line={heldLine}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onShowNumberEntry={vi.fn()}
      />,
    );

    const resumeButton = screen.getByTestId("control-resume-line-call-1");
    expect(resumeButton).toHaveAttribute("aria-label", "Возобновить звонок");
    expect(screen.getByText("Возобновить")).toBeInTheDocument();
    expect(resumeButton.className).toMatch(/buttonResume/);
  });

  it("keeps all controls visible but disables hold, transfer, and dial while connecting", () => {
    const connectingLine: CallLineCardViewModel = {
      ...activeLine,
      state: "Connecting",
      isActiveUnheld: false,
      statusLabel: "call.line.status.connecting",
      holdDisabledReason: "hold_requires_active",
    };
    render(
      <CallControlsBar
        line={connectingLine}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onShowNumberEntry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("control-mute-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-hangup-line-call-1")).toBeEnabled();
    expect(screen.getByTestId("control-hold-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-transfer-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-show-number-entry")).toBeDisabled();
    expect(screen.queryByText("Доступно после соединения")).not.toBeInTheDocument();
    expect(screen.queryByText("Удержание доступно только на активном звонке")).not.toBeInTheDocument();
  });

  it("keeps all controls visible but disables hold, transfer, and dial while ringing incoming", () => {
    const ringingLine: CallLineCardViewModel = {
      ...activeLine,
      state: "Ringing",
      isActiveUnheld: false,
      statusLabel: "call.line.status.ringing",
      primaryAction: "answer",
      holdDisabledReason: "hold_requires_active",
      muteDisabledReason: "mute_requires_active_or_held",
    };
    render(
      <CallControlsBar
        line={ringingLine}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onShowNumberEntry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("control-mute-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-hangup-line-call-1")).toBeEnabled();
    expect(screen.getByTestId("control-hold-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-transfer-line-call-1")).toBeDisabled();
    expect(screen.getByTestId("control-show-number-entry")).toBeDisabled();
  });

  it("invokes DTMF callback", () => {
    const onShowDtmf = vi.fn();
    render(
      <CallControlsBar
        line={activeLine}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={onShowDtmf}
        onShowNumberEntry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("control-show-dtmf"));
    expect(onShowDtmf).toHaveBeenCalledTimes(1);
  });

  it("shows camera controls for video-mode active line", () => {
    const onToggleCamera = vi.fn();
    render(
      <CallControlsBar
        line={activeLine}
        videoState={{
          mediaMode: "video",
          localVideoMuted: true,
          localVideoSource: "camera",
          remoteVideoPresent: true,
          sessionView: "fullscreen",
          cameraAvailable: true,
        }}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onShowNumberEntry={vi.fn()}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={vi.fn()}
        onExpandVideo={vi.fn()}
      />,
    );

    expect(screen.getByTestId("control-camera-line-call-1")).toBeInTheDocument();
    expect(screen.getByTestId("control-screen-share-line-call-1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("control-camera-line-call-1"));
    expect(onToggleCamera).toHaveBeenCalledWith("call-1");
  });
});
