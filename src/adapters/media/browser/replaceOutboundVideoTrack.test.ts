import { describe, expect, it, vi } from "vitest";
import {
  isOutboundVideoSenderSynced,
  replaceOutboundVideoSenderTrack,
} from "./replaceOutboundVideoTrack.js";

function createTrack(kind: "audio" | "video"): MediaStreamTrack {
  return {
    kind,
    enabled: true,
    readyState: "live",
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
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
    const sender = await replaceOutboundVideoSenderTrack(connection, next);
    expect(sender).not.toBeNull();
    expect(replaceTrack).toHaveBeenCalledWith(next);
    expect(videoTrack.kind).toBe("video");
  });

  it("does not fall back to an audio sender", async () => {
    const audioReplace = vi.fn(() => Promise.resolve(undefined));
    const connection = {
      getSenders: () => [{ track: createTrack("audio"), replaceTrack: audioReplace }],
    };

    const sender = await replaceOutboundVideoSenderTrack(connection, createTrack("video"));
    expect(sender).toBeNull();
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
    const sender = await replaceOutboundVideoSenderTrack(connection, next);
    expect(sender).not.toBeNull();
    expect(replaceTrack).toHaveBeenCalledWith(next);
  });

  it("detects sender sync against local stream track", () => {
    const local = createTrack("video");
    const synced = {
      getSenders: () => [{ track: local, replaceTrack: vi.fn() }],
    };
    const mismatched = {
      getSenders: () => [{ track: createTrack("video"), replaceTrack: vi.fn() }],
    };
    expect(isOutboundVideoSenderSynced(synced, local)).toBe(true);
    expect(isOutboundVideoSenderSynced(mismatched, local)).toBe(false);
  });
});
