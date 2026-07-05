import { describe, expect, it } from "vitest";
import { mungeSdpCodecOrder } from "./mungeSdpCodecOrder.js";

const SAMPLE_SDP = [
  "v=0",
  "o=- 123 1 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111 0 8 110 126",
  "c=IN IP4 0.0.0.0",
  "a=rtpmap:111 opus/48000/2",
  "a=fmtp:111 minptime=10;useinbandfec=1",
  "a=rtpmap:0 PCMU/8000",
  "a=rtpmap:8 PCMA/8000",
  "a=rtpmap:110 telephone-event/48000",
  "a=rtpmap:126 telephone-event/8000",
].join("\r\n");

describe("mungeSdpCodecOrder", () => {
  it("reorders m=audio payload types to match preferred MIME list", () => {
    const munged = mungeSdpCodecOrder(SAMPLE_SDP, [
      "audio/PCMU",
      "audio/opus",
      "audio/telephone-event",
    ]);

    const mediaLine = munged.split(/\r?\n/u).find((line) => line.startsWith("m=audio "));
    expect(mediaLine).toBe("m=audio 9 UDP/TLS/RTP/SAVPF 0 111 110 126");
  });

  it("removes disabled voice codecs while keeping telephone-event", () => {
    const munged = mungeSdpCodecOrder(SAMPLE_SDP, ["audio/PCMU", "audio/telephone-event"]);

    expect(munged).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 110 126");
    expect(munged).not.toContain("a=rtpmap:111 opus/48000/2");
    expect(munged).not.toContain("a=rtpmap:8 PCMA/8000");
    expect(munged).toContain("a=rtpmap:110 telephone-event/48000");
  });

  it("returns original SDP when preferences are empty", () => {
    expect(mungeSdpCodecOrder(SAMPLE_SDP, [])).toBe(SAMPLE_SDP);
  });

  it("leaves non-audio media sections unchanged", () => {
    const sdpWithVideo = `${SAMPLE_SDP}\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 VP8/90000`;
    const munged = mungeSdpCodecOrder(sdpWithVideo, ["audio/PCMU", "audio/opus"]);

    expect(munged).toContain("m=video 9 UDP/TLS/RTP/SAVPF 96");
    expect(munged).toContain("a=rtpmap:96 VP8/90000");
  });
});
