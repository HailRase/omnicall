import { describe, expect, it } from "vitest";
import {
  initialSipTransportState,
  isSipTransportConnected,
  transitionSipTransportState,
} from "./SipTransportState.js";

describe("SipTransportState", () => {
  it("starts idle", () => {
    expect(initialSipTransportState()).toBe("idle");
  });

  it("activates session from idle to connecting", () => {
    const result = transitionSipTransportState("idle", "session_activated");
    expect(result).toEqual({ ok: true, state: "connecting" });
  });

  it("connects from connecting to connected", () => {
    const result = transitionSipTransportState("connecting", "transport_connected");
    expect(result).toEqual({ ok: true, state: "connected" });
  });

  it("disconnects from connected to disconnected", () => {
    const result = transitionSipTransportState("connected", "transport_disconnected");
    expect(result).toEqual({ ok: true, state: "disconnected" });
  });

  it("schedules reconnect from disconnected to reconnecting", () => {
    const result = transitionSipTransportState("disconnected", "transport_reconnect_scheduled");
    expect(result).toEqual({ ok: true, state: "reconnecting" });
  });

  it("starts reconnect attempt from reconnecting to connecting", () => {
    const result = transitionSipTransportState("reconnecting", "transport_reconnect_attempt_started");
    expect(result).toEqual({ ok: true, state: "connecting" });
  });

  it("resets to idle on session_reset from any state", () => {
    expect(transitionSipTransportState("connected", "session_reset")).toEqual({
      ok: true,
      state: "idle",
    });
    expect(transitionSipTransportState("reconnecting", "session_reset")).toEqual({
      ok: true,
      state: "idle",
    });
  });

  it("rejects connect while already connected", () => {
    const result = transitionSipTransportState("connected", "transport_connecting");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("transport_already_connected");
    }
  });

  it("isSipTransportConnected only for connected", () => {
    expect(isSipTransportConnected("connected")).toBe(true);
    expect(isSipTransportConnected("connecting")).toBe(false);
    expect(isSipTransportConnected("idle")).toBe(false);
  });
});
