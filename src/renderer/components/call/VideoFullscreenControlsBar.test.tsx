// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CallLineCardViewModel,
  CallVideoMediaState,
} from "@application/index.js";
import { VideoFullscreenControlsBar } from "./VideoFullscreenControlsBar.js";

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

const videoState: CallVideoMediaState = {
  mediaMode: "video",
  localVideoMuted: false,
  localVideoSource: "camera",
  remoteVideoPresent: true,
  sessionView: "fullscreen",
  cameraAvailable: true,
};

const noopHandlers = {
  onMute: vi.fn(),
  onUnmute: vi.fn(),
  onToggleCamera: vi.fn(),
  onToggleScreenShare: vi.fn(),
  onSetSessionView: vi.fn(),
  onHangup: vi.fn(),
};

describe("VideoFullscreenControlsBar", () => {
  it("shows live mic icon when unmuted and muted icon when muted", () => {
    const { rerender } = render(
      <VideoFullscreenControlsBar
        callId="call-1"
        line={activeLine}
        videoState={videoState}
        {...noopHandlers}
      />,
    );

    const unmuted = screen.getByTestId("fullscreen-control-mute-call-1");
    expect(unmuted).toHaveAttribute("aria-pressed", "false");
    expect(unmuted).toHaveAttribute("aria-label", "Отключить микрофон");
    expect(unmuted.className).not.toMatch(/buttonOff/);

    rerender(
      <VideoFullscreenControlsBar
        callId="call-1"
        line={{ ...activeLine, muted: true }}
        videoState={videoState}
        {...noopHandlers}
      />,
    );

    const muted = screen.getByTestId("fullscreen-control-mute-call-1");
    expect(muted).toHaveAttribute("aria-pressed", "true");
    expect(muted).toHaveAttribute("aria-label", "Включить микрофон");
    expect(muted.className).toMatch(/buttonOff/);
  });

  it("marks camera off control with danger color class", () => {
    render(
      <VideoFullscreenControlsBar
        callId="call-1"
        line={activeLine}
        videoState={{ ...videoState, localVideoMuted: true }}
        {...noopHandlers}
      />,
    );

    expect(screen.getByTestId("fullscreen-control-camera-call-1").className).toMatch(
      /buttonOff/,
    );
  });

  it("omits the currently selected view mode from the menu", async () => {
    const user = userEvent.setup();
    render(
      <VideoFullscreenControlsBar
        callId="call-1"
        line={activeLine}
        videoState={videoState}
        {...noopHandlers}
      />,
    );

    await user.click(screen.getByTestId("fullscreen-control-view-mode-call-1"));

    expect(screen.queryByTestId("fullscreen-view-mode-fullscreen")).not.toBeInTheDocument();
    expect(await screen.findByTestId("fullscreen-view-mode-expanded")).toBeInTheDocument();
    expect(screen.getByTestId("fullscreen-view-mode-hidden")).toBeInTheDocument();
  });

  it("applies hangup danger class", () => {
    render(
      <VideoFullscreenControlsBar
        callId="call-1"
        line={activeLine}
        videoState={videoState}
        {...noopHandlers}
      />,
    );

    expect(screen.getByTestId("fullscreen-control-hangup-call-1").className).toMatch(
      /hangup/,
    );
  });
});
