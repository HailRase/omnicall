import { describe, expect, it } from "vitest";
import {
  initialOcpConnectionState,
  transitionOcpConnectionState,
} from "./OcpConnectionState.js";

describe("OcpConnectionState", () => {
  it("starts disconnected", () => {
    expect(initialOcpConnectionState()).toBe("disconnected");
  });

  it("moves to connecting on connect request", () => {
    const result = transitionOcpConnectionState("disconnected", "connect_requested");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state).toBe("connecting");
    }
  });

  it("completes connection", () => {
    const connecting = transitionOcpConnectionState(
      "disconnected",
      "connect_requested",
    );
    if (!connecting.ok) {
      throw new Error("expected connect_requested to succeed");
    }

    const connected = transitionOcpConnectionState(connecting.state, "connected");
    expect(connected.ok).toBe(true);
    if (connected.ok) {
      expect(connected.state).toBe("connected");
    }
  });
});
