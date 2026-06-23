import { createMainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type { OcpSyncGateway } from "@ports/operator/OcpSyncGateway.js";
import { parseOcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";

export const SAMPLE_OCP_QUEUE_INFO_MESSAGE: OcpInboundMessage = {
  kind: "queue_info",
  mainAcallId: createMainAcallId("acall-sample-1"),
  queueName: "Support Queue",
};

/**
 * - Purpose: mock OCP sync gateway for tests and dev bootstrap.
 * - Inputs: raw inbound payloads.
 * - Outputs: parsed OcpInboundMessage or null.
 */
export class MockOcpSyncGateway implements OcpSyncGateway {
  parseInboundMessage(raw: unknown): OcpInboundMessage | null {
    const parsed = parseOcpInboundMessage(raw);
    if (typeof parsed === "string") {
      return null;
    }
    return parsed;
  }
}

export function createSampleOcpQueueInfoRawMessage(
  mainAcallId: string,
  queueName: string,
): Record<string, string> {
  return {
    event: "queue_info",
    main_acallid: mainAcallId,
    queue_name: queueName,
  };
}
