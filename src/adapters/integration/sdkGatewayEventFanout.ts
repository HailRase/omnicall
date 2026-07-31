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
} from "@softomnitel/omnicall-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import { createSdkIsoTimestamp, createSdkOpaqueId } from "./sdkGatewayIds.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";

const EVENT_READ_CAPABILITY: CapabilityId = "session.read.redacted";
const CAMPAIGN_READ_CAPABILITY: CapabilityId = "operator.campaign.read";
const ACD_CONTEXT_READ_CAPABILITY: CapabilityId = "ocp.acd_context.read";

const CAMPAIGN_EVENT_TYPES: ReadonlySet<EventType> = new Set([
  "operator:campaign-offered",
  "operator:campaign-cleared",
]);

const ACD_CONTEXT_EVENT_TYPES: ReadonlySet<EventType> = new Set([
  "call:acd-context",
]);

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
  /** Live Origin matrix enabled caps; omit → grants-only (unit tests). */
  readonly originPolicyCapabilities?: readonly CapabilityId[];
}): boolean {
  if (input.connection.authState !== "authenticated") {
    return false;
  }
  const readable = hasEffectiveCapability(
    input.connection.grantedCapabilities,
    input.originPolicyCapabilities,
    EVENT_READ_CAPABILITY,
  );
  if (!readable) {
    return false;
  }
  if (CAMPAIGN_EVENT_TYPES.has(input.draft.type)) {
    const campaignReadable = hasEffectiveCapability(
      input.connection.grantedCapabilities,
      input.originPolicyCapabilities,
      CAMPAIGN_READ_CAPABILITY,
    );
    if (!campaignReadable) {
      return false;
    }
  }
  if (ACD_CONTEXT_EVENT_TYPES.has(input.draft.type)) {
    const acdReadable = hasEffectiveCapability(
      input.connection.grantedCapabilities,
      input.originPolicyCapabilities,
      ACD_CONTEXT_READ_CAPABILITY,
    );
    if (!acdReadable) {
      return false;
    }
  }
  // Validate before bumping sequence so a schema reject cannot punch a hole
  // that clients interpret as event.sequence_gap.
  const nextSequence = input.connection.eventSequence + 1;
  const candidate = {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event" as const,
    type: input.draft.type,
    eventId: createSdkOpaqueId("evt"),
    sequence: nextSequence,
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
  input.connection.eventSequence = nextSequence;
  input.sendJson(input.connection, validated.data);
  return true;
}

function hasEffectiveCapability(
  granted: readonly CapabilityId[],
  originPolicyCapabilities: readonly CapabilityId[] | undefined,
  capability: CapabilityId,
): boolean {
  if (!granted.includes(capability)) {
    return false;
  }
  if (originPolicyCapabilities === undefined) {
    return true;
  }
  return originPolicyCapabilities.includes(capability);
}

export function fanoutSdkPublicEvent(input: {
  readonly connections: Iterable<SdkGatewayConnection>;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly draft: SdkPublicEventDraftInput;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly getOriginPolicyCapabilities?: (
    origin: string,
  ) => readonly CapabilityId[];
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
        ...(input.getOriginPolicyCapabilities !== undefined
          ? {
              originPolicyCapabilities: input.getOriginPolicyCapabilities(
                connection.origin,
              ),
            }
          : {}),
      })
    ) {
      delivered += 1;
    }
  }
  return delivered;
}
