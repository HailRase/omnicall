/**
 * - Purpose: model call identity, direction, number, and lifecycle state.
 * - Inputs: call id, direction, phone number, transition events.
 * - Outputs: immutable Call entity snapshots after valid transitions.
 */
import type { CallDirection } from "./CallDirection.js";
import type { CallId } from "./CallId.js";
import type { PhoneNumber } from "./PhoneNumber.js";
import type { CallState } from "./CallState.js";
import {
  transitionCallState,
  type CallTransitionEvent,
  type CallTransitionResult,
} from "./CallStateMachine.js";
import { initialCallState } from "./CallState.js";

export type Call = Readonly<{
  id: CallId;
  direction: CallDirection;
  phoneNumber: PhoneNumber;
  state: CallState;
}>;

export function createOutgoingCall(id: CallId, phoneNumber: PhoneNumber): Call {
  return {
    id,
    direction: "outgoing",
    phoneNumber,
    state: initialCallState(),
  };
}

export function applyCallTransition(
  call: Call,
  event: CallTransitionEvent,
): Readonly<{
  call: Call;
  transition: CallTransitionResult;
}> {
  const transition = transitionCallState(call.state, event);
  if (!transition.ok) {
    return { call, transition };
  }

  return {
    call: {
      ...call,
      state: transition.state,
    },
    transition,
  };
}

