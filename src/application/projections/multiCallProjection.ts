import type { DomainEvent } from "@domain/index.js";
import type { MultiCallSettings } from "@domain/index.js";
import { deriveSecondSessionDialpadDisabled } from "@domain/index.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

export type MultiCallDisabledReason =
  | "second_session_disabled"
  | "hold_all_in_progress"
  | "connecting_in_progress";

export type MultiCallPolicyViolation = Readonly<{
  scenario: string;
  reason: string;
  affectedCallIds: ReadonlyArray<string>;
  occurredAt: string;
}>;

export type MultiCallProjection = Readonly<{
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  hasEstablishedCall: boolean;
  hasConnectingCall: boolean;
  holdAllInProgress: boolean;
  activeUnheldCallId: string | null;
  establishedCallCount: number;
  isSecondSessionDisabled: boolean;
  secondSessionDisabledReason: MultiCallDisabledReason | null;
  lastBlockedDirection: "outgoing" | "incoming_answer" | null;
  lastPolicyViolation: MultiCallPolicyViolation | null;
}>;

/**
 * - Purpose: project multi-call policy state for dialpad and incoming answer guards.
 * - Inputs: domain events and optional settings snapshot.
 * - Outputs: immutable multi-call projection with disabled reasons.
 */
export function initialMultiCallProjection(
  settings: MultiCallSettings = {
    multiSessionsEnabled: true,
    autoUnholdOnTransferFailure: true,
  },
): MultiCallProjection {
  return createMultiCallProjection({
    multiSessionsEnabled: settings.multiSessionsEnabled,
    hasEstablishedCall: false,
    hasConnectingCall: false,
    holdAllInProgress: false,
    activeUnheldCallId: null,
    establishedCallCount: 0,
    lastBlockedDirection: null,
    lastPolicyViolation: null,
  });
}

export function setMultiCallSettings(
  projection: MultiCallProjection,
  settings: MultiCallSettings,
): MultiCallProjection {
  return createMultiCallProjection({
    ...projection,
    multiSessionsEnabled: settings.multiSessionsEnabled,
    autoUnholdOnTransferFailure: settings.autoUnholdOnTransferFailure !== false,
  });
}

export function reduceMultiCallProjection(
  projection: MultiCallProjection,
  event: DomainEvent,
): MultiCallProjection {
  if (isSessionResetEvent(event)) {
    return initialMultiCallProjection({
      multiSessionsEnabled: projection.multiSessionsEnabled,
      autoUnholdOnTransferFailure: projection.autoUnholdOnTransferFailure,
    });
  }

  switch (event.type) {
    case "CallAnswered":
      return createMultiCallProjection({
        ...projection,
        hasEstablishedCall: true,
        establishedCallCount: projection.establishedCallCount + 1,
        activeUnheldCallId: asOptionalString(event["callId"]),
        hasConnectingCall: false,
      });
    case "CallHeld":
      return createMultiCallProjection({
        ...projection,
        activeUnheldCallId:
          projection.activeUnheldCallId === asOptionalString(event["callId"])
            ? null
            : projection.activeUnheldCallId,
      });
    case "CallResumed":
      return createMultiCallProjection({
        ...projection,
        activeUnheldCallId: asOptionalString(event["callId"]),
      });
    case "OutgoingCallRequested":
      return createMultiCallProjection({
        ...projection,
        hasConnectingCall: true,
        holdAllInProgress: false,
      });
    case "CallFailed":
    case "CallEnded":
      return decrementEstablishedIfNeeded(projection, asOptionalString(event["callId"]));
    case "AllOtherCallsHeld": {
      const phase = event["phase"];
      if (phase === "in_progress") {
        return createMultiCallProjection({
          ...projection,
          holdAllInProgress: true,
          hasEstablishedCall: true,
        });
      }
      return createMultiCallProjection({
        ...projection,
        holdAllInProgress: false,
      });
    }
    case "SecondSessionBlocked": {
      const direction = event["direction"];
      const next = createMultiCallProjection({
        ...projection,
        lastBlockedDirection:
          direction === "incoming_answer" ? "incoming_answer" : "outgoing",
      });
      return {
        ...next,
        isSecondSessionDisabled: true,
        secondSessionDisabledReason: "second_session_disabled",
      };
    }
    case "MultiCallOperationRejected":
      return createMultiCallProjection({
        ...projection,
        lastPolicyViolation: {
          scenario: asRequiredString(event["scenario"]),
          reason: asRequiredString(event["reason"]),
          affectedCallIds: asStringArray(event["affectedCallIds"]),
          occurredAt: asRequiredString(event["occurredAt"]),
        },
      });
    default:
      return projection;
  }
}

export function deriveIncomingAnswerDisabledReason(
  projection: MultiCallProjection,
): string | null {
  if (projection.holdAllInProgress) {
    return "Удержание других звонков…";
  }
  if (projection.hasConnectingCall) {
    return "Соединение…";
  }
  if (
    projection.isSecondSessionDisabled &&
    projection.secondSessionDisabledReason === "second_session_disabled" &&
    (projection.lastBlockedDirection === "incoming_answer" ||
      (projection.hasEstablishedCall && !projection.multiSessionsEnabled))
  ) {
    return "Вторая сессия отключена";
  }
  if (projection.hasEstablishedCall && !projection.multiSessionsEnabled) {
    return "Вторая сессия отключена";
  }
  return null;
}

export function deriveResumeMultiCallDisabledReason(
  projection: MultiCallProjection,
): string | null {
  if (projection.holdAllInProgress) {
    return "Удержание других звонков…";
  }
  if (projection.hasConnectingCall) {
    return "Соединение…";
  }
  return null;
}

type MultiCallProjectionInput = Readonly<{
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure?: boolean;
  hasEstablishedCall: boolean;
  hasConnectingCall: boolean;
  holdAllInProgress: boolean;
  activeUnheldCallId: string | null;
  establishedCallCount: number;
  lastBlockedDirection: "outgoing" | "incoming_answer" | null;
  lastPolicyViolation?: MultiCallPolicyViolation | null;
}>;

function createMultiCallProjection(
  input: MultiCallProjectionInput,
): MultiCallProjection {
  const dialpadState = deriveSecondSessionDialpadDisabled(
    input.hasEstablishedCall,
    input.hasConnectingCall,
    input.holdAllInProgress,
    { multiSessionsEnabled: input.multiSessionsEnabled },
  );

  return {
    multiSessionsEnabled: input.multiSessionsEnabled,
    autoUnholdOnTransferFailure: input.autoUnholdOnTransferFailure ?? true,
    hasEstablishedCall: input.hasEstablishedCall,
    hasConnectingCall: input.hasConnectingCall,
    holdAllInProgress: input.holdAllInProgress,
    activeUnheldCallId: input.activeUnheldCallId,
    establishedCallCount: input.establishedCallCount,
    isSecondSessionDisabled: dialpadState.disabled,
    secondSessionDisabledReason: dialpadState.reason,
    lastBlockedDirection: input.lastBlockedDirection,
    lastPolicyViolation: input.lastPolicyViolation ?? null,
  };
}

function decrementEstablishedIfNeeded(
  projection: MultiCallProjection,
  endedCallId: string | null,
): MultiCallProjection {
  if (endedCallId === null || projection.establishedCallCount === 0) {
    return createMultiCallProjection({
      ...projection,
      hasEstablishedCall: false,
      hasConnectingCall: false,
      establishedCallCount: 0,
      activeUnheldCallId: null,
      lastBlockedDirection: null,
    });
  }

  const nextCount = Math.max(0, projection.establishedCallCount - 1);
  return createMultiCallProjection({
    ...projection,
    hasEstablishedCall: nextCount > 0,
    hasConnectingCall: false,
    establishedCallCount: nextCount,
    activeUnheldCallId:
      projection.activeUnheldCallId === endedCallId ? null : projection.activeUnheldCallId,
    lastBlockedDirection: nextCount === 0 ? null : projection.lastBlockedDirection,
  });
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): ReadonlyArray<string> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}
