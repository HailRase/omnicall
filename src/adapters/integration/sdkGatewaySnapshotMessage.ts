/**
 * Build public sdk:snapshot wire messages (DI-05).
 */

import {
  PROTOCOL_MAJOR,
  SnapshotSectionsSchema,
  WireJsonObjectSchema,
  type CapabilityId,
  type SnapshotSections,
  type WireJsonObject,
  type WireMessage,
} from "@axata/axatalk-protocol";

import { createSdkIsoTimestamp, createSdkOpaqueId } from "./sdkGatewayIds.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";

export function buildSdkSnapshotMessage(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly revision: number;
  readonly clientId: string;
  readonly grantedCapabilities: readonly CapabilityId[];
  readonly productSections: WireJsonObject;
  readonly windowVisible: boolean;
}): WireMessage | null {
  const sections = mergeSnapshotSections(input);
  if (sections === null) {
    return null;
  }
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "snapshot",
    type: "sdk:snapshot",
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    revision: input.revision,
    occurredAt: createSdkIsoTimestamp(input.now),
    sections,
  };
}

export function extractProductSectionsFromReplyResult(
  result: WireJsonObject,
): WireJsonObject | null {
  const sections = result["sections"];
  if (typeof sections !== "object" || sections === null || Array.isArray(sections)) {
    return null;
  }
  const parsed = WireJsonObjectSchema.safeParse(sections);
  return parsed.success ? parsed.data : null;
}

function mergeSnapshotSections(input: {
  readonly clientId: string;
  readonly grantedCapabilities: readonly CapabilityId[];
  readonly productSections: WireJsonObject;
  readonly windowVisible: boolean;
}): SnapshotSections | null {
  const candidate = {
    session: {
      clientId: input.clientId,
      grantedCapabilities: [...input.grantedCapabilities],
      authenticated: true as const,
    },
    ...input.productSections,
    window: { visible: input.windowVisible },
  };
  const parsed = SnapshotSectionsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function buildWindowVisibilityEvent(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly sequence: number;
  readonly revision: number;
  readonly visible: boolean;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event",
    type: "window:visibility-changed",
    eventId: createSdkOpaqueId("evt"),
    sequence: input.sequence,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: input.revision,
    payload: { visible: input.visible },
  };
}
