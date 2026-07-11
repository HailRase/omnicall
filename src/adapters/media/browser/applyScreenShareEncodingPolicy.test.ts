import { describe, expect, it, vi } from "vitest";
import { applyScreenShareEncodingPolicy } from "./applyScreenShareEncodingPolicy.js";

describe("applyScreenShareEncodingPolicy", () => {
  it("sets contentHint and encoding caps when sender supports parameters", () => {
    const track = { contentHint: "" } as MediaStreamTrack & { contentHint: string };
    const setParameters = vi.fn(() => Promise.resolve(undefined));
    const sender = {
      getParameters: () => ({ encodings: [{}] }),
      setParameters,
    };

    applyScreenShareEncodingPolicy(track, sender);
    expect(track.contentHint).toBe("detail");
    expect(setParameters).toHaveBeenCalledWith({
      encodings: [{ maxFramerate: 30, maxBitrate: 2_500_000 }],
    });
  });

  it("does not throw when sender lacks setParameters", () => {
    const track = { contentHint: "" } as MediaStreamTrack & { contentHint: string };
    expect(() => {
      applyScreenShareEncodingPolicy(track, {});
    }).not.toThrow();
    expect(track.contentHint).toBe("detail");
  });
});
