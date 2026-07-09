import { describe, expect, it, vi } from "vitest";
import { replaceOutboundVideoSenderTrack } from "./replaceOutboundVideoTrack.js";

function createTrack(kind: "audio" | "video"): MediaStreamTrack {
  return { kind, enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
}

describe("replaceOutboundVideoSenderTrack", () => {
  it("replaces an explicit video sender track", async () => {
    const replaceTrack = vi.fn(() => Promise.resolve(undefined));
    const videoTrack = createTrack("video");
    const connection = {
      getSenders: () => [
        { track: createTrack("audio"), replaceTrack: vi.fn() },
        { track: createTrack("video"), replaceTrack },
      ],
    };

    const next = createTrack("video");
    const replaced = await replaceOutboundVideoSenderTrack(connection, next);
    expect(replaced).toBe(true);
    expect(replaceTrack).toHaveBeenCalledWith(next);
    expect(videoTrack.kind).toBe("video");
  });

  it("does not fall back to an audio sender", async () => {
    const audioReplace = vi.fn(() => Promise.resolve(undefined));
    const connection = {
      getSenders: () => [{ track: createTrack("audio"), replaceTrack: audioReplace }],
    };

    const replaced = await replaceOutboundVideoSenderTrack(connection, createTrack("video"));
    expect(replaced).toBe(false);
    expect(audioReplace).not.toHaveBeenCalled();
  });

  it("uses null-track sender when audio sender already exists", async () => {
    const replaceTrack = vi.fn(() => Promise.resolve(undefined));
    const connection = {
      getSenders: () => [
        { track: createTrack("audio"), replaceTrack: vi.fn() },
        { track: null, replaceTrack },
      ],
    };

    const next = createTrack("video");
    const replaced = await replaceOutboundVideoSenderTrack(connection, next);
    expect(replaced).toBe(true);
    expect(replaceTrack).toHaveBeenCalledWith(next);
  });
});
