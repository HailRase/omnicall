/**
 * - Purpose: own the product-focused call line after committed telephony events.
 * - Inputs: a domain event, projected live lines, incoming state, and explicit selection intent.
 * - Outputs: immutable focus state for controls, headset mirroring, and integrations.
 */
import type { DomainEvent } from "@domain/index.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";
import type { MultiLineCallProjection } from "./multiLineCallProjection.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type CallFocusProjection = Readonly<{
  focusedCallId: string | null;
  explicitCallId: string | null;
  suspendedExplicitCallId: string | null;
}>;

export type CallFocusReductionContext = Readonly<{
  multiLineCallProjection: MultiLineCallProjection;
  incomingCallProjection: IncomingCallProjection;
}>;

const TERMINAL_EVENT_TYPES = new Set<string>([
  "CallEnded",
  "CallFailed",
  "CallRejected",
  "CallRejectedByDnd",
  "IncomingCallEndedBeforeAnswer",
]);

export function initialCallFocusProjection(): CallFocusProjection {
  return {
    focusedCallId: null,
    explicitCallId: null,
    suspendedExplicitCallId: null,
  };
}

export function reduceCallFocusProjection(
  projection: CallFocusProjection,
  event: DomainEvent,
  context: CallFocusReductionContext,
): CallFocusProjection {
  if (isSessionResetEvent(event)) {
    return initialCallFocusProjection();
  }

  const callId = readCallId(event);
  if (
    callId !== null &&
    TERMINAL_EVENT_TYPES.has(event.type) &&
    projection.focusedCallId === callId
  ) {
    return {
      ...projection,
      // Preserve the event-time focus until the next committed event. This lets
      // mapper subscribers evaluate a terminal fact after its line is removed.
      focusedCallId: callId,
    };
  }

  const normalized = normalizeStaleFocus(projection, context);
  if (callId === null) {
    return normalized;
  }

  if (event.type === "IncomingCallReceived") {
    return {
      focusedCallId: callId,
      explicitCallId: normalized.explicitCallId,
      suspendedExplicitCallId: normalized.focusedCallId,
    };
  }

  if (event.type === "OutgoingCallRequested" && !hasIncomingCall(context)) {
    return {
      focusedCallId: callId,
      explicitCallId: callId,
      suspendedExplicitCallId: null,
    };
  }

  if (event.type === "CallAnswered" && normalized.focusedCallId === callId) {
    return normalized;
  }

  return normalized;
}

export function applyCallFocusSelectionIntent(
  callId: string | null,
  context: CallFocusReductionContext,
): CallFocusProjection {
  if (callId === null || !isLiveCallId(callId, context)) {
    return {
      focusedCallId: selectFallbackCall(context),
      explicitCallId: null,
      suspendedExplicitCallId: null,
    };
  }
  return {
    focusedCallId: callId,
    explicitCallId: callId,
    suspendedExplicitCallId: null,
  };
}

function normalizeStaleFocus(
  projection: CallFocusProjection,
  context: CallFocusReductionContext,
): CallFocusProjection {
  if (projection.focusedCallId === null || isLiveCallId(projection.focusedCallId, context)) {
    return projection;
  }
  const explicitCallId =
    projection.explicitCallId !== null && isLiveCallId(projection.explicitCallId, context)
      ? projection.explicitCallId
      : projection.suspendedExplicitCallId !== null &&
          isLiveCallId(projection.suspendedExplicitCallId, context)
        ? projection.suspendedExplicitCallId
        : null;
  return {
    focusedCallId: explicitCallId ?? selectFallbackCall(context),
    explicitCallId,
    suspendedExplicitCallId: null,
  };
}

function isLiveCallId(callId: string, context: CallFocusReductionContext): boolean {
  return (
    (context.incomingCallProjection.visible &&
      context.incomingCallProjection.callId === callId) ||
    context.multiLineCallProjection.lines.some((line) => line.callId === callId)
  );
}

function hasIncomingCall(context: CallFocusReductionContext): boolean {
  return (
    context.incomingCallProjection.visible &&
    context.incomingCallProjection.callId !== null
  );
}

function selectFallbackCall(context: CallFocusReductionContext): string | null {
  const active = context.multiLineCallProjection.lines.find((line) => line.state === "Active");
  if (active !== undefined) {
    return active.callId;
  }
  const connecting = context.multiLineCallProjection.lines.find(
    (line) => line.state === "Connecting",
  );
  if (connecting !== undefined) {
    return connecting.callId;
  }
  const held = context.multiLineCallProjection.lines.find((line) => line.state === "Held");
  if (held !== undefined) {
    return held.callId;
  }
  if (hasIncomingCall(context)) {
    return context.incomingCallProjection.callId;
  }
  return context.multiLineCallProjection.lines[0]?.callId ?? null;
}

function readCallId(event: DomainEvent): string | null {
  const callId = event["callId"];
  return typeof callId === "string" && callId.length > 0 ? callId : null;
}
