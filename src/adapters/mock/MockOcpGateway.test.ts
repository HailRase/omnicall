import { describe, expect, it } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { MockOcpGateway } from "./MockOcpGateway.js";

describe("MockOcpGateway", () => {
  it("records sent commands and simulates auth success", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });

    const sendResult = gateway.sendCommand({
      kind: "change_status_to_break",
      operatorId: 1,
      reasonId: 2,
      callType: "internal",
    });
    expect(sendResult.ok).toBe(true);
    expect(gateway.getSentCommands()).toHaveLength(1);
    expect(gateway.getLastSentCommand()?.kind).toBe("change_status_to_break");

    const states: string[] = [];
    gateway.onConnectionStateChange((state) => {
      states.push(state);
    });
    gateway.simulateAuthSuccess(42);

    expect(gateway.getConnectionState()).toBe("authenticated");
    expect(states.at(-1)).toBe("authenticated");
    expect(OperatorStatus.READY).toBe(1);
  });

  it("simulateDisconnect sets disconnected state", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    gateway.simulateDisconnect();
    expect(gateway.getConnectionState()).toBe("disconnected");
  });

  it("clearSentCommands empties command trace", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    gateway.sendCommand({ kind: "auth", token: "token" });
    gateway.clearSentCommands();
    expect(gateway.getSentCommands()).toHaveLength(0);
    expect(gateway.getLastSentCommand()).toBeUndefined();
  });
});
