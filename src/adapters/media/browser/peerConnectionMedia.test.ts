import { describe, expect, it } from "vitest";
import { hasLiveRemoteVideoTrack } from "./peerConnectionMedia.js";

function createConnectionWithVideoTrack(
  track: Partial<MediaStreamTrack>,
): {
  getSenders: () => ReadonlyArray<{ track: MediaStreamTrack | null }>;
  getReceivers: () => ReadonlyArray<{ track: MediaStreamTrack | null }>;
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
} {
  return {
    getSenders: () => [],
    getReceivers: () => [{ track: track as MediaStreamTrack }],
    addEventListener: () => undefined,
  };
}

describe("hasLiveRemoteVideoTrack", () => {
  it("returns true for live muted video track", () => {
    const connection = createConnectionWithVideoTrack({
      kind: "video",
      muted: true,
      readyState: "live",
    });

    expect(hasLiveRemoteVideoTrack(connection)).toBe(true);
  });

  it("returns true for live unmuted video track", () => {
    const connection = createConnectionWithVideoTrack({
      kind: "video",
      muted: false,
      readyState: "live",
    });

    expect(hasLiveRemoteVideoTrack(connection)).toBe(true);
  });
});
