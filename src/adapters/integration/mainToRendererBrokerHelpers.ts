/**
 * Pure helpers for MainToRendererBroker (keep broker class under file-size limit).
 */

import type { CommandMessage } from "@softomnitel/omnicall-protocol";
import type { BrokerProductRequest } from "@ports/integration/MainToRendererBrokerPort.js";

let brokerRequestSeq = 0;

export function nextBrokerRequestId(): string {
  brokerRequestSeq += 1;
  return `brk_${brokerRequestSeq.toString(36)}_${Date.now().toString(36)}`;
}

function readExpectedRevision(
  payload: CommandMessage["payload"],
): number | undefined {
  if (
    "expectedRevision" in payload &&
    typeof payload.expectedRevision === "number"
  ) {
    return payload.expectedRevision;
  }
  return undefined;
}

export function toProductRequest(message: CommandMessage): BrokerProductRequest {
  const expectedRevision = readExpectedRevision(message.payload);
  if (expectedRevision === undefined) {
    return {
      requestId: message.requestId,
      commandType: message.type,
      payload: message.payload,
    };
  }
  return {
    requestId: message.requestId,
    commandType: message.type,
    payload: message.payload,
    expectedRevision,
  };
}
