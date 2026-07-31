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
} from "@softomnitel/omnicall-protocol";

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
  let productSections = stripUnauthorizedCampaign(
    input.productSections,
    input.grantedCapabilities,
  );
  productSections = stripUnauthorizedAcdContext(
    productSections,
    input.grantedCapabilities,
  );
  const candidate = {
    session: {
      clientId: input.clientId,
      grantedCapabilities: [...input.grantedCapabilities],
      authenticated: true as const,
    },
    ...productSections,
    window: { visible: input.windowVisible },
  };
  const parsed = SnapshotSectionsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Campaign snapshot requires `operator.campaign.read` (ADR-0019).
 * Strip without dropping the rest of the operator section.
 */
function stripUnauthorizedCampaign(
  productSections: WireJsonObject,
  grantedCapabilities: readonly CapabilityId[],
): WireJsonObject {
  if (grantedCapabilities.includes("operator.campaign.read")) {
    return productSections;
  }
  const operator = productSections["operator"];
  const operatorParsed = WireJsonObjectSchema.safeParse(operator);
  if (!operatorParsed.success || !("campaign" in operatorParsed.data)) {
    return productSections;
  }
  const rest: Record<string, WireJsonObject[string]> = {};
  for (const [key, value] of Object.entries(operatorParsed.data)) {
    if (key !== "campaign") {
      rest[key] = value;
    }
  }
  return {
    ...productSections,
    operator: rest,
  };
}

/**
 * ACD wire on call summaries requires `ocp.acd_context.read` (ADR-0020).
 * Keeps additive `queueLabel` for session.read.redacted clients.
 */
function stripUnauthorizedAcdContext(
  productSections: WireJsonObject,
  grantedCapabilities: readonly CapabilityId[],
): WireJsonObject {
  if (grantedCapabilities.includes("ocp.acd_context.read")) {
    return productSections;
  }
  const calls = productSections["calls"];
  if (!Array.isArray(calls)) {
    return productSections;
  }
  const strippedCalls = calls.map((entry: unknown) => {
    const parsed = WireJsonObjectSchema.safeParse(entry);
    if (!parsed.success || !("acdContext" in parsed.data)) {
      return parsed.success ? parsed.data : {};
    }
    const rest: Record<string, WireJsonObject[string]> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key !== "acdContext") {
        rest[key] = value;
      }
    }
    return rest;
  });
  return {
    ...productSections,
    calls: strippedCalls,
  };
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
