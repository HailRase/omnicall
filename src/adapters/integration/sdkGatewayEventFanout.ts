/**
 * Per-connection public event fan-out (DI-05). No broadcast across clients.
 */

import {
  PROTOCOL_MAJOR,
  EventTypeSchema,
  WireJsonObjectSchema,
  validateWireMessage,
  type CapabilityId,
  type EventType,
  type WireJsonObject,
  type WireMessage,
} from "@axatalk/protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import { createSdkIsoTimestamp, createSdkOpaqueId } from "./sdkGatewayIds.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";

const EVENT_READ_CAPABILITY: CapabilityId = "session.read.redacted";

export type SdkPublicEventDraftInput = Readonly<{
  type: EventType;
  payload: WireJsonObject;
  revision: number;
}>;

export function parseSdkPublicEventDraft(
  input: unknown,
): SdkPublicEventDraftInput | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  if (!("type" in input) || !("payload" in input)) {
    return null;
  }
  const typeParsed = EventTypeSchema.safeParse(input.type);
  if (!typeParsed.success) {
    return null;
  }
  const payloadParsed = WireJsonObjectSchema.safeParse(input.payload);
  if (!payloadParsed.success) {
    return null;
  }
  const revision =
    "revision" in input &&
    typeof input.revision === "number" &&
    Number.isInteger(input.revision) &&
    input.revision >= 0
      ? input.revision
      : 0;
  return {
    type: typeParsed.data,
    payload: payloadParsed.data,
    revision,
  };
}

/**
 * Deliver a public event to one authenticated connection with read capability.
 */
export function deliverSdkEventToConnection(input: {
  readonly connection: SdkGatewayConnection;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly draft: SdkPublicEventDraftInput;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
}): boolean {
  if (input.connection.authState !== "authenticated") {
    return false;
  }
  if (!input.connection.grantedCapabilities.includes(EVENT_READ_CAPABILITY)) {
    return false;
  }
  input.connection.eventSequence += 1;
  const candidate = {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event" as const,
    type: input.draft.type,
    eventId: createSdkOpaqueId("evt"),
    sequence: input.connection.eventSequence,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: input.draft.revision,
    payload: input.draft.payload,
  };
  const validated = validateWireMessage(candidate);
  if (!validated.success) {
    return false;
  }
  input.sendJson(input.connection, validated.data);
  return true;
}

export function fanoutSdkPublicEvent(input: {
  readonly connections: Iterable<SdkGatewayConnection>;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly draft: SdkPublicEventDraftInput;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
}): number {
  let delivered = 0;
  for (const connection of input.connections) {
    if (
      deliverSdkEventToConnection({
        connection,
        identity: input.identity,
        now: input.now,
        draft: input.draft,
        sendJson: input.sendJson,
      })
    ) {
      delivered += 1;
    }
  }
  return delivered;
}
