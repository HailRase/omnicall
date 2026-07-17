import { describe, expect, it } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { MockOcpGateway } from "./MockOcpGateway.js";

describe("MockOcpGateway", () => {
  it("records sent commands; auth success does not change transport state", () => {
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

    // Transport-only: users does not flip gateway to authenticated.
    expect(gateway.getConnectionState()).toBe("connected");
    expect(states).toHaveLength(0);
    expect(OperatorStatus.READY).toBe(1);
  });

  it("simulateDisconnect sets failed (unexpected drop)", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    gateway.simulateDisconnect();
    expect(gateway.getConnectionState()).toBe("failed");
  });

  it("clearSentCommands empties command trace", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    gateway.sendCommand({ kind: "auth", token: "token" });
    gateway.clearSentCommands();
    expect(gateway.getSentCommands()).toHaveLength(0);
    expect(gateway.getLastSentCommand()).toBeUndefined();
  });

  it("increments socket generation on each connect (one-socket identity)", () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    const first = gateway.getSocketGeneration();
    gateway.disconnect("logout");
    gateway.connect({ domain: "ocp.example.com", authToken: "t2" });
    expect(gateway.getSocketGeneration()).toBe(first + 1);
  });
});
