import {
  isSipTransportConnected,
  type SipTransportState,
} from "./SipTransportState.js";

export type SipLifecyclePhase = "idle" | "active";

export type SipRegistrationState =
  | "idle"
  | "registering"
  | "registered"
  | "failed";

export type SipRecoveryTarget = "transport" | "registration";

export type SipRecoverySnapshot = Readonly<{
  target: SipRecoveryTarget | null;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  lastFailureReason: string | null;
}>;

export type SipSessionHealth = Readonly<{
  lifecycle: SipLifecyclePhase;
  transport: SipTransportState;
  registration: SipRegistrationState;
  recovery: SipRecoverySnapshot;
}>;

export const EMPTY_SIP_RECOVERY_SNAPSHOT: SipRecoverySnapshot = {
  target: null,
  attemptNumber: 0,
  maxAttempts: 0,
  nextRetryAt: null,
  lastFailureReason: null,
};

/**
 * - Purpose: idle SIP session health before first auth attempt.
 * - Inputs: none.
 * - Outputs: SipSessionHealth with all axes idle.
 */
export function createIdleSipSessionHealth(): SipSessionHealth {
  return {
    lifecycle: "idle",
    transport: "idle",
    registration: "idle",
    recovery: EMPTY_SIP_RECOVERY_SNAPSHOT,
  };
}

/**
 * - Purpose: derive effective registration for projections (ADR-0004 invariant).
 * - Inputs: session health snapshot.
 * - Outputs: idle when transport down; otherwise stored registration state.
 */
export function getEffectiveRegistrationState(
  health: SipSessionHealth,
): SipRegistrationState {
  if (!isSipTransportConnected(health.transport)) {
    return "idle";
  }
  return health.registration;
}

/**
 * - Purpose: detect whether SIP is registered for call guards.
 * - Inputs: session health snapshot.
 * - Outputs: true only when transport connected and registration registered.
 */
export function isEffectivelyRegistered(health: SipSessionHealth): boolean {
  return getEffectiveRegistrationState(health) === "registered";
}

export type SipSessionHealthInvariantViolation = Readonly<{
  code:
    | "registration_shown_while_transport_down"
    | "registration_recovery_while_transport_down"
    | "transport_recovery_with_registration_in_flight"
    | "logout_not_idle";
  message: string;
}>;

/**
 * - Purpose: validate ADR-0004 session health invariants.
 * - Inputs: session health snapshot.
 * - Outputs: list of violated invariants (empty when valid).
 */
export function validateSipSessionHealthInvariants(
  health: SipSessionHealth,
): ReadonlyArray<SipSessionHealthInvariantViolation> {
  const violations: SipSessionHealthInvariantViolation[] = [];

  if (
    !isSipTransportConnected(health.transport) &&
    health.registration === "registered"
  ) {
    violations.push({
      code: "registration_shown_while_transport_down",
      message: "registration cannot be registered when transport is not connected",
    });
  }

  if (
    health.recovery.target === "registration" &&
    !isSipTransportConnected(health.transport)
  ) {
    violations.push({
      code: "registration_recovery_while_transport_down",
      message: "registration recovery requires connected transport",
    });
  }

  if (
    health.recovery.target === "transport" &&
    health.registration === "registering"
  ) {
    violations.push({
      code: "transport_recovery_with_registration_in_flight",
      message: "transport recovery must not run while registration is in flight",
    });
  }

  if (health.lifecycle === "idle" && health.recovery.target !== null) {
    violations.push({
      code: "logout_not_idle",
      message: "recovery must be cleared when lifecycle is idle",
    });
  }

  return violations;
}

/**
 * - Purpose: apply transport loss — clear registration and effective registered state.
 * - Inputs: current session health.
 * - Outputs: health with registration idle and transport disconnected.
 */
export function applySipTransportLoss(health: SipSessionHealth): SipSessionHealth {
  return {
    ...health,
    transport: "disconnected",
    registration: "idle",
    recovery:
      health.recovery.target === "registration"
        ? EMPTY_SIP_RECOVERY_SNAPSHOT
        : health.recovery,
  };
}

/**
 * - Purpose: apply logout teardown — all axes return idle.
 * - Inputs: current session health.
 * - Outputs: fully idle health with cleared recovery.
 */
export function applySipSessionReset(health: SipSessionHealth): SipSessionHealth {
  void health;
  return createIdleSipSessionHealth();
}
