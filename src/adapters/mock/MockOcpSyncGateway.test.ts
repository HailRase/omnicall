import { describe, expect, it } from "vitest";
import {
  createSampleOcpQueueInfoRawMessage,
  MockOcpSyncGateway,
  SAMPLE_OCP_QUEUE_INFO_MESSAGE,
} from "./MockOcpSyncGateway.js";

describe("MockOcpSyncGateway", () => {
  const gateway = new MockOcpSyncGateway();

  it("parses sample queue info fixture", () => {
    const raw = createSampleOcpQueueInfoRawMessage("acall-1", "Sales");
    expect(gateway.parseInboundMessage(raw)).toEqual({
      kind: "queue_info",
      mainAcallId: "acall-1",
      queueName: "Sales",
    });
  });

  it("returns null for invalid payload", () => {
    expect(gateway.parseInboundMessage({ event: "unknown" })).toBeNull();
  });

  it("exports typed sample message constant", () => {
    expect(SAMPLE_OCP_QUEUE_INFO_MESSAGE.kind).toBe("queue_info");
  });
});
