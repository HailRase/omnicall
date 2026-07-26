import { describe, expect, it } from "vitest";
import {
  clearCallOcpContext,
  initialCallOcpContextProjection,
  markCallOcpContextPending,
  markCallOcpContextUnavailable,
  resolveCallOcpContext,
  type CallOcpContextAcdWire,
} from "./callOcpContextProjection.js";

function wire(
  overrides: Partial<CallOcpContextAcdWire> &
    Pick<CallOcpContextAcdWire, "acallId" | "queue">,
): CallOcpContextAcdWire {
  return {
    event: "incomingCallProgress",
    callerId: "+1",
    calledId: "op",
    userLogin: "op",
    phase: "progress",
    ...overrides,
  };
}

describe("callOcpContextProjection", () => {
  it("marks pending, resolves queue + acdWire, and clears on end", () => {
    let projection = initialCallOcpContextProjection();
    projection = markCallOcpContextPending(projection, {
      callId: "c1",
      direction: "incoming",
    });
    expect(projection.byCallId.c1?.resolveState).toBe("pending");

    projection = resolveCallOcpContext(projection, {
      callId: "c1",
      acallId: "a1",
      queueName: "  Sales  ",
      acdWire: wire({ acallId: "a1", queue: "Sales", mainAcallId: "m1" }),
    });
    expect(projection.byCallId.c1).toMatchObject({
      acallId: "a1",
      queueName: "Sales",
      resolveState: "resolved",
      direction: "incoming",
      acdWire: { acallId: "a1", mainAcallId: "m1", userLogin: "op" },
    });

    projection = clearCallOcpContext(projection, "c1");
    expect(projection.byCallId.c1).toBeUndefined();
  });

  it("treats empty queue as resolved null (direct/internal)", () => {
    let projection = markCallOcpContextPending(initialCallOcpContextProjection(), {
      callId: "c2",
      direction: "incoming",
    });
    projection = resolveCallOcpContext(projection, {
      callId: "c2",
      acallId: "a2",
      queueName: "   ",
      acdWire: wire({ acallId: "a2", queue: "" }),
    });
    expect(projection.byCallId.c2).toMatchObject({
      queueName: null,
      resolveState: "resolved",
      acdWire: { queue: "" },
    });
  });

  it("marks unavailable only while pending", () => {
    let projection = markCallOcpContextPending(initialCallOcpContextProjection(), {
      callId: "c3",
      direction: "incoming",
    });
    projection = markCallOcpContextUnavailable(projection, "c3");
    expect(projection.byCallId.c3?.resolveState).toBe("unavailable");

    projection = resolveCallOcpContext(projection, {
      callId: "c3",
      acallId: "a3",
      queueName: "Q",
      acdWire: wire({ acallId: "a3", queue: "Q" }),
    });
    const afterResolved = markCallOcpContextUnavailable(projection, "c3");
    expect(afterResolved.byCallId.c3?.resolveState).toBe("resolved");
  });
});
