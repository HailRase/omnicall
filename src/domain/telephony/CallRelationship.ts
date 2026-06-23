/**
 * - Purpose: model attended-transfer call relationship and session phase transitions.
 * - Inputs: transfer session snapshot, transition event, optional consultation call id.
 * - Outputs: next session snapshot or deterministic rejection reason.
 */
import type { CallId } from "./CallId.js";
import type { PhoneNumber } from "./PhoneNumber.js";

export type CallRole = "source" | "consultation";

export type TransferSessionPhase =
  | "idle"
  | "consultation_dialing"
  | "consultation_active"
  | "attended_transfer_in_progress"
  | "attended_transfer_failed";

export type TransferSession = Readonly<{
  sourceCallId: CallId;
  consultationCallId: CallId | null;
  targetNumber: PhoneNumber | null;
  phase: TransferSessionPhase;
}>;

export type TransferSessionTransition =
  | "consultation_started"
  | "attended_transfer_requested"
  | "attended_transfer_completed"
  | "attended_transfer_failed"
  | "consultation_aborted";

export type TransferSessionTransitionResult =
  | Readonly<{ ok: true; session: TransferSession | null }>
  | Readonly<{ ok: false; reason: string }>;

export function createTransferSession(
  sourceCallId: CallId,
  targetNumber: PhoneNumber,
  consultationCallId: CallId,
): TransferSession {
  return {
    sourceCallId,
    consultationCallId,
    targetNumber,
    phase: "consultation_dialing",
  };
}

export function transitionTransferSession(
  session: TransferSession | null,
  event: TransferSessionTransition,
  consultationCallId?: CallId,
): TransferSessionTransitionResult {
  switch (event) {
    case "consultation_started":
      if (session === null || session.phase !== "consultation_dialing") {
        return { ok: false, reason: "consultation_start_requires_dialing" };
      }
      if (consultationCallId === undefined) {
        return { ok: false, reason: "consultation_call_id_required" };
      }
      if (session.consultationCallId !== consultationCallId) {
        return { ok: false, reason: "consultation_call_id_mismatch" };
      }
      return {
        ok: true,
        session: { ...session, phase: "consultation_active" },
      };

    case "attended_transfer_requested":
      if (session === null) {
        return { ok: false, reason: "attended_transfer_requires_active_consultation" };
      }
      if (
        session.phase !== "consultation_active" &&
        session.phase !== "attended_transfer_failed"
      ) {
        return { ok: false, reason: "attended_transfer_requires_active_consultation" };
      }
      return {
        ok: true,
        session: { ...session, phase: "attended_transfer_in_progress" },
      };

    case "attended_transfer_completed":
      if (session === null || session.phase !== "attended_transfer_in_progress") {
        return { ok: false, reason: "attended_complete_requires_in_progress" };
      }
      return { ok: true, session: null };

    case "attended_transfer_failed":
      if (session === null || session.phase !== "attended_transfer_in_progress") {
        return { ok: false, reason: "attended_failed_requires_in_progress" };
      }
      return {
        ok: true,
        session: { ...session, phase: "attended_transfer_failed" },
      };

    case "consultation_aborted":
      return { ok: true, session: null };

    default:
      return { ok: false, reason: "unknown_transition" };
  }
}

export function isTransferSessionBlockingSecondConsultation(
  session: TransferSession | null,
): boolean {
  if (session === null) {
    return false;
  }
  return (
    session.phase === "consultation_dialing" ||
    session.phase === "consultation_active" ||
    session.phase === "attended_transfer_in_progress" ||
    session.phase === "attended_transfer_failed"
  );
}
