import type { DomainEvent } from "@domain/index.js";
import type { CallState } from "@domain/index.js";

export type CallLineRole = "source" | "consultation" | "primary";

export type CallLine = Readonly<{
  callId: string;
  role: CallLineRole;
  state: CallState | "Idle";
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
  switch (event.type) {
    case "ConsultationCallRequested":
      return applyConsultationRequested(projection, event);
    case "ConsultationCallStarted":
      return applyConsultationStarted(projection, event);
    case "ConsultationCallFailed":
      return applyConsultationFailed(projection, event);
    case "AttendedTransferRequested":
      return {
        ...projection,
        attendedPhase: "attended_transfer_in_progress",
      };
    case "AttendedTransferCompleted":
      return initialMultiLineCallProjection();
    case "AttendedTransferFailed":
      return {
        ...projection,
        attendedPhase: "attended_transfer_failed",
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "OutgoingCallRequested":
    case "IncomingCallReceived":
      return upsertLine(projection, {
        callId: asRequiredString(event["callId"]),
        role: projection.sourceCallId === null ? "primary" : "consultation",
        state: event.type === "OutgoingCallRequested" ? "Connecting" : "Ringing",
      });
    case "CallAnswered":
      return updateLineState(projection, asRequiredString(event["callId"]), "Active");
    case "CallHeld":
      return updateLineState(projection, asRequiredString(event["callId"]), "Held");
    case "CallResumed":
      return updateLineState(projection, asRequiredString(event["callId"]), "Active");
    case "CallTransferRequested":
      return updateLineState(projection, asRequiredString(event["callId"]), "Transferring");
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
  const next = updateLineState(projection, consultationCallId, "Active");
  return {
    ...next,
    sourceCallId,
    consultationCallId,
    primaryCallId: consultationCallId,
    attendedPhase: "consultation_active",
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
    lastFailureReason: asOptionalString(event["reason"]),
  };
}

function upsertLine(
  projection: MultiLineCallProjection,
  line: CallLine,
): MultiLineCallProjection {
  const existingIndex = projection.lines.findIndex((entry) => entry.callId === line.callId);
  if (existingIndex === -1) {
    return {
      ...projection,
      lines: [...projection.lines, line],
      primaryCallId: line.role === "consultation" ? line.callId : projection.primaryCallId,
    };
  }

  const lines = projection.lines.map((entry, index) =>
    index === existingIndex ? { ...entry, ...line } : entry,
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
  const consultationCallId =
    projection.consultationCallId === callId ? null : projection.consultationCallId;
  const sourceCallId = projection.sourceCallId === callId ? null : projection.sourceCallId;
  const primaryCallId = projection.primaryCallId === callId ? sourceCallId : projection.primaryCallId;
  const attendedPhase =
    consultationCallId === null && sourceCallId === null ? "idle" : projection.attendedPhase;
  return {
    ...projection,
    lines,
    consultationCallId,
    sourceCallId,
    primaryCallId,
    attendedPhase,
  };
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

function asRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
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
