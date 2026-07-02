export type SipTransportState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export const SIP_TRANSPORT_STATES: ReadonlyArray<SipTransportState> = [
  "idle",
  "connecting",
  "connected",
  "reconnecting",
  "disconnected",
];

export type SipTransportTransitionEvent =
  | "session_activated"
  | "transport_connecting"
  | "transport_connected"
  | "transport_disconnected"
  | "transport_reconnect_scheduled"
  | "transport_reconnect_attempt_started"
  | "session_reset";

export type SipTransportTransitionResult =
  | Readonly<{ ok: true; state: SipTransportState }>
  | Readonly<{ ok: false; reason: string; state: SipTransportState }>;

/**
 * - Purpose: initial SIP transport FSM state before auth.
 * - Inputs: none.
 * - Outputs: idle transport state.
 */
export function initialSipTransportState(): SipTransportState {
  return "idle";
}

/**
 * - Purpose: apply transport lifecycle event to FSM (ADR-0004).
 * - Inputs: current state, transition event.
 * - Outputs: next state or rejected transition with reason.
 */
export function transitionSipTransportState(
  current: SipTransportState,
  event: SipTransportTransitionEvent,
): SipTransportTransitionResult {
  switch (event) {
    case "session_activated":
      if (current === "idle") {
        return { ok: true, state: "connecting" };
      }
      return { ok: false, reason: "session_not_idle", state: current };

    case "transport_connecting":
      if (
        current === "idle" ||
        current === "connecting" ||
        current === "reconnecting" ||
        current === "disconnected"
      ) {
        return { ok: true, state: "connecting" };
      }
      return { ok: false, reason: "transport_already_connected", state: current };

    case "transport_connected":
      if (current === "connecting" || current === "reconnecting") {
        return { ok: true, state: "connected" };
      }
      return { ok: false, reason: "transport_not_connecting", state: current };

    case "transport_disconnected":
      if (current === "connected" || current === "connecting" || current === "reconnecting") {
        return { ok: true, state: "disconnected" };
      }
      return { ok: false, reason: "transport_not_active", state: current };

    case "transport_reconnect_scheduled":
      if (current === "disconnected" || current === "connected") {
        return { ok: true, state: "reconnecting" };
      }
      return { ok: false, reason: "transport_reconnect_not_allowed", state: current };

    case "transport_reconnect_attempt_started":
      if (current === "reconnecting") {
        return { ok: true, state: "connecting" };
      }
      return { ok: false, reason: "transport_not_reconnecting", state: current };

    case "session_reset":
      return { ok: true, state: "idle" };
  }
}

/**
 * - Purpose: detect whether transport can carry SIP REGISTER.
 * - Inputs: transport state.
 * - Outputs: true only when connected.
 */
export function isSipTransportConnected(state: SipTransportState): boolean {
  return state === "connected";
}
