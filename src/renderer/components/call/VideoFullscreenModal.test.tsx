// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallVideoMediaState } from "@application/index.js";
import { VideoFullscreenModal } from "./VideoFullscreenModal.js";

afterEach(() => {
  cleanup();
});

const videoState: CallVideoMediaState = {
  mediaMode: "video",
  localVideoMuted: false,
  localVideoSource: "camera",
  remoteVideoPresent: true,
  sessionView: "fullscreen",
  cameraAvailable: true,
};

describe("VideoFullscreenModal", () => {
  it("closes to minimal (expanded) view via close button", () => {
    const onClose = vi.fn();
    render(
      <VideoFullscreenModal
        open
        callId="call-1"
        videoState={videoState}
        line={null}
        onBindSurfaces={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onToggleCamera={vi.fn()}
        onToggleScreenShare={vi.fn()}
        onSetSessionView={vi.fn()}
        onHangup={vi.fn()}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("video-fullscreen-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("video-fullscreen-close-call-1"));
    expect(onClose).toHaveBeenCalledWith("call-1");
  });

  it("renders nothing when session view is not fullscreen", () => {
    const { container } = render(
      <VideoFullscreenModal
        open
        callId="call-1"
        videoState={{ ...videoState, sessionView: "expanded" }}
        line={null}
        onBindSurfaces={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onToggleCamera={vi.fn()}
        onToggleScreenShare={vi.fn()}
        onSetSessionView={vi.fn()}
        onHangup={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
