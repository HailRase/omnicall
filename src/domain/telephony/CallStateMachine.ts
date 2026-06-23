/**
 * - Purpose: control valid call lifecycle transitions.
 * - Inputs: current CallState and transition event.
 * - Outputs: next state or deterministic rejection reason.
 */
import type { CallState } from "./CallState.js";
import { initialCallState } from "./CallState.js";

export type CallTransitionEvent =
  | "incoming_received"
  | "outgoing_requested"
  | "outgoing_started"
  | "progress_received"
  | "answered"
  | "reject_requested"
  | "reject_completed"
  | "ended"
  | "hold_requested"
  | "resumed"
  | "transfer_requested"
  | "transfer_completed"
  | "transfer_failed"
  | "hangup_requested"
  | "hangup_completed"
  | "failed"
  | "reset";

export type CallTransitionResult =
  | Readonly<{ ok: true; state: CallState }>
  | Readonly<{ ok: false; state: CallState; reason: string }>;

export function transitionCallState(
  current: CallState,
  event: CallTransitionEvent,
): CallTransitionResult {
  switch (event) {
    case "incoming_received":
      if (current === "Idle") {
        return { ok: true, state: "Ringing" };
      }
      return reject(current, "incoming_requires_idle");

    case "outgoing_requested":
      if (current === "Idle") {
        return { ok: true, state: "Connecting" };
      }
      return reject(current, "call_not_idle");

    case "outgoing_started":
      if (current === "Connecting") {
        return { ok: true, state: "Connecting" };
      }
      return reject(current, "call_not_connecting");

    case "progress_received":
      if (current === "Connecting") {
        return { ok: true, state: "Ringing" };
      }
      return reject(current, "progress_requires_connecting");

    case "answered":
      if (current === "Connecting" || current === "Ringing") {
        return { ok: true, state: "Active" };
      }
      return reject(current, "answer_requires_connecting_or_ringing");

    case "reject_requested":
      if (current === "Ringing") {
        return { ok: true, state: "Ending" };
      }
      return reject(current, "reject_requires_ringing");

    case "reject_completed":
      if (current === "Ending") {
        return { ok: true, state: "Ended" };
      }
      return reject(current, "reject_complete_requires_ending");

    case "ended":
      if (
        current === "Connecting" ||
        current === "Ringing" ||
        current === "Active" ||
        current === "Ending"
      ) {
        return { ok: true, state: "Ended" };
      }
      return reject(current, "end_not_allowed");

    case "hold_requested":
      if (current === "Active") {
        return { ok: true, state: "Held" };
      }
      return reject(current, "hold_requires_active");

    case "resumed":
      if (current === "Held") {
        return { ok: true, state: "Active" };
      }
      return reject(current, "resume_requires_held");

    case "transfer_requested":
      if (current === "Active" || current === "Held") {
        return { ok: true, state: "Transferring" };
      }
      return reject(current, "transfer_requires_active_or_held");

    case "transfer_completed":
      if (current === "Transferring") {
        return { ok: true, state: "Ended" };
      }
      return reject(current, "transfer_complete_requires_transferring");

    case "transfer_failed":
      if (current === "Transferring") {
        return { ok: true, state: "Active" };
      }
      return reject(current, "transfer_failed_requires_transferring");

    case "hangup_requested":
      if (
        current === "Connecting" ||
        current === "Ringing" ||
        current === "Active" ||
        current === "Held" ||
        current === "Transferring" ||
        current === "Conference"
      ) {
        return { ok: true, state: "Ending" };
      }
      return reject(current, "hangup_not_allowed");

    case "hangup_completed":
      if (current === "Ending") {
        return { ok: true, state: "Ended" };
      }
      return reject(current, "hangup_complete_requires_ending");

    case "failed":
      if (
        current === "Connecting" ||
        current === "Ringing" ||
        current === "Transferring" ||
        current === "Ending"
      ) {
        return { ok: true, state: "Failed" };
      }
      return reject(current, "failure_not_allowed");

    case "reset":
      if (current === "Ended" || current === "Failed") {
        return { ok: true, state: initialCallState() };
      }
      return reject(current, "reset_requires_terminal_state");
  }
}

function reject(state: CallState, reason: string): CallTransitionResult {
  return { ok: false, state, reason };
}

