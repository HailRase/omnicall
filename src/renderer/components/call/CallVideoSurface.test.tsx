// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallVideoMediaState } from "@application/index.js";
import { CallVideoSurface } from "./CallVideoSurface.js";

afterEach(() => {
  cleanup();
});

const videoState: CallVideoMediaState = {
  mediaMode: "video",
  localVideoMuted: true,
  localVideoSource: "camera",
  remoteVideoPresent: false,
  sessionView: "compact",
  cameraAvailable: true,
};

describe("CallVideoSurface", () => {
  it("renders remote placeholder and local muted label for video mode", () => {
    const onBindSurfaces = vi.fn();
    render(
      <CallVideoSurface
        callId="call-1"
        videoState={videoState}
        onBindSurfaces={onBindSurfaces}
      />,
    );

    expect(screen.getByTestId("call-video-surface-call-1")).toBeInTheDocument();
    expect(screen.getByTestId("call-video-remote-placeholder-call-1")).toBeInTheDocument();
    expect(screen.getByText("Камера выкл.")).toBeInTheDocument();
    expect(onBindSurfaces).toHaveBeenCalledWith(
      "call-1",
      expect.any(HTMLVideoElement),
      expect.any(HTMLVideoElement),
    );
  });

  it("hides and shows local preview pane", () => {
    render(
      <CallVideoSurface
        callId="call-1"
        videoState={videoState}
        onBindSurfaces={vi.fn()}
      />,
    );

    const hideButton = screen.getByTestId("call-video-local-hide-call-1");
    fireEvent.click(hideButton);
    expect(screen.getByTestId("call-video-local-show-call-1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("call-video-local-show-call-1"));
    expect(screen.queryByTestId("call-video-local-show-call-1")).not.toBeInTheDocument();
  });

  it("hides surface for audio mode", () => {
    const { container } = render(
      <CallVideoSurface
        callId="call-2"
        videoState={{ ...videoState, mediaMode: "audio" }}
        onBindSurfaces={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
