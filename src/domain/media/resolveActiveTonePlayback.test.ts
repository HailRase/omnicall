import { describe, expect, it } from "vitest";
import { createCallId } from "../telephony/CallId.js";
import { resolveActiveTonePlayback } from "./resolveActiveTonePlayback.js";
import type { TonePlaybackRequest } from "./TonePlaybackRequest.js";

function request(
  callId: string,
  kind: TonePlaybackRequest["kind"],
  sequence: number,
): TonePlaybackRequest {
  return {
    callId: createCallId(callId),
    kind,
    sequence,
  };
}

describe("resolveActiveTonePlayback", () => {
  it("returns null when there are no requests", () => {
    expect(resolveActiveTonePlayback([])).toBeNull();
  });

  it("prefers incoming ringtone over ringback", () => {
    const winner = resolveActiveTonePlayback([
      request("outbound", "ringback", 1),
      request("incoming", "ringtone", 2),
    ]);

    expect(winner?.callId).toBe(createCallId("incoming"));
    expect(winner?.kind).toBe("ringtone");
  });

  it("prefers ringback over terminal failure tones", () => {
    const winner = resolveActiveTonePlayback([
      request("failed", "busy", 1),
      request("outbound", "ringback", 2),
    ]);

    expect(winner?.callId).toBe(createCallId("outbound"));
    expect(winner?.kind).toBe("ringback");
  });

  it("plays only the earliest ringtone when multiple incoming calls ring", () => {
    const winner = resolveActiveTonePlayback([
      request("incoming-a", "ringtone", 1),
      request("incoming-b", "ringtone", 2),
    ]);

    expect(winner?.callId).toBe(createCallId("incoming-a"));
    expect(winner?.kind).toBe("ringtone");
  });

  it("switches to the next ringing line after the first ringtone request ends", () => {
    const winner = resolveActiveTonePlayback([
      request("incoming-b", "ringtone", 2),
    ]);

    expect(winner?.callId).toBe(createCallId("incoming-b"));
    expect(winner?.kind).toBe("ringtone");
  });

  it("prefers busy over failed when priorities tie at terminal level", () => {
    const winner = resolveActiveTonePlayback([
      request("failed-a", "failed", 1),
      request("failed-b", "busy", 2),
    ]);

    expect(winner?.callId).toBe(createCallId("failed-b"));
    expect(winner?.kind).toBe("busy");
  });
});
