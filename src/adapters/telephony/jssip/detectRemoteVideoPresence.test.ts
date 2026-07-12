import { describe, expect, it } from "vitest";

import { detectRemoteVideoPresence } from "./detectRemoteVideoPresence.js";

describe("detectRemoteVideoPresence", () => {
  it("returns true for an active video media section", () => {
    expect(
      detectRemoteVideoPresence(
        "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n",
      ),
    ).toBe(true);
  });

  it("returns false when remote video section is inactive", () => {
    expect(
      detectRemoteVideoPresence(
        "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=inactive\r\n",
      ),
    ).toBe(false);
  });

  it("returns false when remote video is recvonly", () => {
    expect(
      detectRemoteVideoPresence(
        "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=recvonly\r\n",
      ),
    ).toBe(false);
  });

  it("returns true when remote video is sendonly", () => {
    expect(
      detectRemoteVideoPresence(
        "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=sendonly\r\n",
      ),
    ).toBe(true);
  });

  it.each([
    ["missing video section", "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"],
    ["rejected video section", "v=0\r\nm=video 0 UDP/TLS/RTP/SAVPF 96\r\n"],
    ["malformed video port", "v=0\r\nm=video invalid UDP/TLS/RTP/SAVPF 96\r\n"],
  ])("returns false for %s", (_label, sdp) => {
    expect(detectRemoteVideoPresence(sdp)).toBe(false);
  });
});
