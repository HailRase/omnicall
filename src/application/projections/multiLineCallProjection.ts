import type { DomainEvent } from "@domain/index.js";
import type { CallState } from "@domain/index.js";
import { isBenignTransferFailureReason } from "./transferFailureReasons.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

export type CallLineRole = "source" | "consultation" | "primary";

export type CallLine = Readonly<{
  callId: string;
  role: CallLineRole;
  state: CallState | "Idle";
  muted: boolean;
  displayLabel: string | null;
  activeSinceMs: number | null;
  isRemoteHold: boolean;
  dtmfHistory: string;
  lastDtmfTone: string | null;
}>;

export type MultiLineCallProjection = Readonly<{
  lines: ReadonlyArray<CallLine>;
  primaryCallId: string | null;
  consultationCallId: string | null;
  sourceCallId: string | null;
  attendedPhase:
    | "idle"
    | "consultation_dialing"
    | "consultation_active"
    | "attended_transfer_in_progress"
    | "attended_transfer_failed";
  lastFailureReason: string | null;
}>;

/**
 * - Purpose: project multi-line call state for attended transfer read model.
 * - Inputs: previous projection and domain event.
 * - Outputs: immutable multi-line projection for store wiring.
 */
export function initialMultiLineCallProjection(): MultiLineCallProjection {
  return {
    lines: [],
    primaryCallId: null,
    consultationCallId: null,
    sourceCallId: null,
    attendedPhase: "idle",
    lastFailureReason: null,
  };
}

export function reduceMultiLineCallProjection(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  if (isSessionResetEvent(event)) {
    return initialMultiLineCallProjection();
  }

  switch (event.type) {
    case "ConsultationCallRequested":
      return applyConsultationRequested(projection, event);
    case "ConsultationCallStarted":
      return setLineActiveSince(
        applyConsultationStarted(projection, event),
        asRequiredString(event["consultationCallId"]),
        "Active",
        parseOccurredAtMs(event.occurredAt),
      );
    case "ConsultationCallFailed":
      return applyConsultationFailed(projection, event);
    case "AttendedTransferRequested":
      return {
        ...projection,
        attendedPhase: "attended_transfer_in_progress",
        lastFailureReason: null,
      };
    case "AttendedTransferCompleted":
      return initialMultiLineCallProjection();
    case "AttendedTransferFailed":
      return {
        ...projection,
        attendedPhase: "attended_transfer_failed",
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "TransferModeStarted":
      return applyTransferModeStarted(projection, event);
    case "TransferModeCancelled":
      return applyTransferModeCancelled(projection, event);
    case "OutgoingCallRequested":
      return upsertLine(projection, {
        callId: asRequiredString(event["callId"]),
        role: projection.sourceCallId === null ? "primary" : "consultation",
        state: "Connecting",
        displayLabel: asOptionalString(event["phoneNumber"]),
      });
    case "IncomingCallReceived":
      return upsertLine(projection, {
        callId: asRequiredString(event["callId"]),
        role: projection.sourceCallId === null ? "primary" : "consultation",
        state: "Ringing",
        displayLabel: asOptionalString(event["phoneNumber"]),
      });
    case "IncomingCallDisplayNameResolved":
      return updateLineDisplayLabel(
        projection,
        asRequiredString(event["callId"]),
        asRequiredString(event["displayName"]),
      );
    case "CallAnswered":
      return setLineActiveSince(
        projection,
        asRequiredString(event["callId"]),
        "Active",
        parseOccurredAtMs(event.occurredAt),
      );
    case "CallHeld":
      return updateLineState(projection, asRequiredString(event["callId"]), "Held");
    case "CallResumed":
      return updateLineState(projection, asRequiredString(event["callId"]), "Active");
    case "CallMuted":
      return setLineMuted(projection, asRequiredString(event["callId"]), true);
    case "CallUnmuted":
      return setLineMuted(projection, asRequiredString(event["callId"]), false);
    case "DtmfSent":
      return appendLineDtmfTone(
        projection,
        asRequiredString(event["callId"]),
        asRequiredString(event["tone"]),
      );
    case "CallTransferRequested":
      return {
        ...updateLineState(projection, asRequiredString(event["callId"]), "Transferring"),
        lastFailureReason: null,
      };
    case "CallTransferFailed":
      return applyBlindTransferFailed(projection, event);
    case "CallTransferred":
    case "CallEnded":
    case "CallFailed":
    case "CallRejected":
      return removeLine(projection, asRequiredString(event["callId"]));
    default:
      return projection;
  }
}

function applyConsultationRequested(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const sourceCallId = asRequiredString(event["sourceCallId"]);
  const consultationCallId = asRequiredString(event["consultationCallId"]);
  let next = upsertLine(projection, {
    callId: sourceCallId,
    role: "source",
    state: findLineState(projection, sourceCallId) ?? "Held",
  });
  next = upsertLine(next, {
    callId: consultationCallId,
    role: "consultation",
    state: "Connecting",
    displayLabel: asOptionalString(event["targetNumber"]),
  });
  return {
    ...next,
    sourceCallId,
    consultationCallId,
    primaryCallId: consultationCallId,
    attendedPhase: "consultation_dialing",
    lastFailureReason: null,
  };
}

function applyConsultationStarted(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const consultationCallId = asRequiredString(event["consultationCallId"]);
  const sourceCallId = asRequiredString(event["sourceCallId"]);
  const targetNumber = asOptionalString(event["targetNumber"]);
  const next = upsertLine(updateLineState(projection, consultationCallId, "Active"), {
    callId: consultationCallId,
    role: "consultation",
    state: "Active",
    displayLabel: targetNumber,
  });
  return {
    ...next,
    sourceCallId,
    consultationCallId,
    primaryCallId: consultationCallId,
    attendedPhase: "consultation_active",
  };
}

function applyBlindTransferFailed(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const callId = asRequiredString(event["callId"]);
  const restoredSourceState = parseRestoredSourceState(event["restoredSourceState"]);
  const next = updateLineState(projection, callId, restoredSourceState);
  return {
    ...next,
    lastFailureReason: asOptionalFailureReason(event["reason"]),
  };
}

function applyConsultationFailed(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const consultationCallId = asRequiredString(event["consultationCallId"]);
  const sourceCallId = asRequiredString(event["sourceCallId"]);
  const restoredSourceState = parseRestoredSourceState(event["restoredSourceState"]);
  const lines = projection.lines
    .filter((line) => line.callId !== consultationCallId)
    .map((line) =>
      line.callId === sourceCallId
        ? { ...line, role: "primary" as const, state: restoredSourceState }
        : line,
    );
  return {
    ...projection,
    lines,
    sourceCallId,
    consultationCallId: null,
    primaryCallId: sourceCallId,
    attendedPhase: "idle",
    lastFailureReason: asOptionalFailureReason(event["reason"]),
  };
}

function applyTransferModeStarted(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const sourceCallId = asRequiredString(event["callId"]);
  const lines = projection.lines.map((line) => {
    if (line.callId === sourceCallId) {
      return { ...line, role: "source" as const };
    }
    if (line.role === "source") {
      return { ...line, role: "primary" as const };
    }
    return line;
  });
  return {
    ...projection,
    lines,
    sourceCallId,
    lastFailureReason: null,
  };
}

function applyTransferModeCancelled(
  projection: MultiLineCallProjection,
  event: DomainEvent,
): MultiLineCallProjection {
  const sourceCallId = asOptionalString(event["callId"]) ?? projection.sourceCallId;
  const consultationCallId = asOptionalString(event["consultationCallId"]);
  const restoredSourceState = parseRestoredSourceState(event["restoredSourceState"]);

  if (consultationCallId !== null && sourceCallId !== null) {
    const lines = projection.lines
      .filter((line) => line.callId !== consultationCallId)
      .map((line) =>
        line.callId === sourceCallId
          ? { ...line, role: "primary" as const, state: restoredSourceState }
          : line,
      );
    return {
      ...projection,
      lines,
      sourceCallId,
      consultationCallId: null,
      primaryCallId: sourceCallId,
      attendedPhase: "idle",
      lastFailureReason: null,
    };
  }

  const lines = projection.lines.map((line) =>
    line.role === "source" ? { ...line, role: "primary" as const } : line,
  );
  return {
    ...projection,
    lines,
    sourceCallId: null,
    lastFailureReason: null,
    attendedPhase: projection.consultationCallId === null ? "idle" : projection.attendedPhase,
  };
}

function upsertLine(
  projection: MultiLineCallProjection,
  line: Partial<CallLine> & Pick<CallLine, "callId" | "role" | "state">,
): MultiLineCallProjection {
  const existing = projection.lines.find((entry) => entry.callId === line.callId);
  const normalizedLine: CallLine = {
    callId: line.callId,
    role: line.role,
    state: line.state,
    muted: line.muted ?? existing?.muted ?? false,
    displayLabel: line.displayLabel ?? existing?.displayLabel ?? null,
    activeSinceMs: line.activeSinceMs ?? existing?.activeSinceMs ?? null,
    isRemoteHold: line.isRemoteHold ?? existing?.isRemoteHold ?? false,
    dtmfHistory: line.dtmfHistory ?? existing?.dtmfHistory ?? "",
    lastDtmfTone: line.lastDtmfTone ?? existing?.lastDtmfTone ?? null,
  };
  const existingIndex = projection.lines.findIndex((entry) => entry.callId === line.callId);
  if (existingIndex === -1) {
    return {
      ...projection,
      lines: [...projection.lines, normalizedLine],
      primaryCallId:
        normalizedLine.role === "consultation"
          ? normalizedLine.callId
          : projection.primaryCallId,
    };
  }

  const lines = projection.lines.map((entry, index) =>
    index === existingIndex ? { ...entry, ...normalizedLine } : entry,
  );
  return { ...projection, lines };
}

function updateLineState(
  projection: MultiLineCallProjection,
  callId: string,
  state: CallState | "Idle",
): MultiLineCallProjection {
  const lines = projection.lines.map((line) =>
    line.callId === callId ? { ...line, state } : line,
  );
  return {
    ...projection,
    lines,
    primaryCallId:
      state === "Active" && projection.consultationCallId === callId
        ? callId
        : projection.primaryCallId,
  };
}

function removeLine(
  projection: MultiLineCallProjection,
  callId: string,
): MultiLineCallProjection {
  const lines = projection.lines.filter((line) => line.callId !== callId);
  const removedConsultation = projection.consultationCallId === callId;
  const consultationCallId = removedConsultation ? null : projection.consultationCallId;
  const sourceCallId = projection.sourceCallId === callId ? null : projection.sourceCallId;
  const primaryCallId = projection.primaryCallId === callId ? sourceCallId : projection.primaryCallId;
  const attendedPhase = removedConsultation
    ? "idle"
    : consultationCallId === null && sourceCallId === null
      ? "idle"
      : projection.attendedPhase;
  return {
    ...projection,
    lines,
    consultationCallId,
    sourceCallId,
    primaryCallId,
    attendedPhase,
  };
}

function setLineMuted(
  projection: MultiLineCallProjection,
  callId: string,
  muted: boolean,
): MultiLineCallProjection {
  const lines = projection.lines.map((line) =>
    line.callId === callId ? { ...line, muted } : line,
  );
  return { ...projection, lines };
}

function appendLineDtmfTone(
  projection: MultiLineCallProjection,
  callId: string,
  tone: string,
): MultiLineCallProjection {
  const lines = projection.lines.map((line) =>
    line.callId === callId
      ? { ...line, dtmfHistory: `${line.dtmfHistory}${tone}`, lastDtmfTone: tone }
      : line,
  );
  return { ...projection, lines };
}

function findLineState(
  projection: MultiLineCallProjection,
  callId: string,
): CallState | "Idle" | null {
  const line = projection.lines.find((entry) => entry.callId === callId);
  return line?.state ?? null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asOptionalFailureReason(value: unknown): string | null {
  const reason = asOptionalString(value);
  if (reason === null || isBenignTransferFailureReason(reason)) {
    return null;
  }
  return reason;
}

function asRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseOccurredAtMs(occurredAt: string): number {
  const parsed = Date.parse(occurredAt);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function updateLineDisplayLabel(
  projection: MultiLineCallProjection,
  callId: string,
  displayLabel: string,
): MultiLineCallProjection {
  const lines = projection.lines.map((line) =>
    line.callId === callId ? { ...line, displayLabel } : line,
  );
  return { ...projection, lines };
}

function setLineActiveSince(
  projection: MultiLineCallProjection,
  callId: string,
  state: CallState | "Idle",
  activeSinceMs: number,
): MultiLineCallProjection {
  const lines = projection.lines.map((line) =>
    line.callId === callId ? { ...line, state, activeSinceMs } : line,
  );
  return { ...projection, lines };
}

function parseRestoredSourceState(value: unknown): CallState | "Idle" {
  if (
    value === "Active" ||
    value === "Held" ||
    value === "Connecting" ||
    value === "Ringing" ||
    value === "Transferring" ||
    value === "Ending" ||
    value === "Ended" ||
    value === "Failed" ||
    value === "Conference"
  ) {
    return value;
  }
  return "Held";
}
