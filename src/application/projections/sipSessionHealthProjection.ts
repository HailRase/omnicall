import type { DomainEvent } from "@domain/index.js";
import {
  applySipSessionReset,
  applySipTransportLoss,
  createIdleSipSessionHealth,
  EMPTY_SIP_RECOVERY_SNAPSHOT,
  type SipRecoveryTarget,
  type SipSessionHealth,
} from "@domain/index.js";
import { DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS } from "@domain/settings/SipRecoverySettings.js";
import { transitionSipTransportState } from "@domain/telephony/SipTransportState.js";

export type SipSessionHealthProjection = SipSessionHealth;

/**
 * - Purpose: initial SIP session health read model before auth (ADR-0004).
 * - Inputs: none.
 * - Outputs: idle SipSessionHealth projection.
 */
export function initialSipSessionHealthProjection(): SipSessionHealthProjection {
  return createIdleSipSessionHealth();
}

/**
 * - Purpose: project unified SIP transport/registration health from domain events.
 * - Inputs: prior projection, domain event.
 * - Outputs: immutable SipSessionHealth read model.
 */
export function reduceSipSessionHealthProjection(
  projection: SipSessionHealthProjection,
  event: DomainEvent,
): SipSessionHealthProjection {
  if (event.type === "SipSessionReset" || event.type === "UserSessionEnded") {
    return applySipSessionReset(projection);
  }

  switch (event.type) {
    case "SipSessionActivated":
      return applyLifecycleActive(projection);
    case "RegistrationRequested":
      return applyRegistrationRequested(projection);
    case "SipTransportConnecting":
      return applyTransportTransition(projection, "transport_connecting", {
        lifecycle: "active",
      });
    case "SipTransportConnected":
      return applyTransportConnected(projection);
    case "SipTransportDisconnected":
      return applyTransportDisconnected(projection, asOptionalString(event["reason"]));
    case "SipRegistrationCleared":
      return {
        ...projection,
        registration: "idle",
        recovery:
          projection.recovery.target === "registration"
            ? EMPTY_SIP_RECOVERY_SNAPSHOT
            : projection.recovery,
      };
    case "SipTransportReconnectScheduled":
      return applyRecoveryScheduled(projection, "transport", event);
    case "SipTransportReconnectAttemptStarted":
      return applyTransportReconnectAttemptStarted(projection, event);
    case "SipTransportReconnectSucceeded":
      return applyTransportReconnectSucceeded(projection);
    case "SipTransportReconnectFailed":
      return applyTransportReconnectFailed(projection, event);
    case "ManualSipTransportReconnectRequested":
      return applyManualTransportReconnect(projection);
    case "ManualSipReregisterRequested":
      return applyManualReregister(projection);
    case "RegistrationSucceeded":
      return applyRegistrationSucceeded(projection);
    case "RegistrationFailed":
      return applyRegistrationFailed(projection, asOptionalString(event["reason"]));
    case "SipRegistrationRetryScheduled":
      return applyRecoveryScheduled(projection, "registration", event);
    case "SipRegistrationRetryAttemptStarted":
      return applyRegistrationRetryAttemptStarted(projection, event);
    case "SipRegistrationRetrySucceeded":
      return applyRegistrationRetrySucceeded(projection);
    case "SipRegistrationRetryFailed":
      return applyRegistrationRetryFailed(projection, event);
    default:
      return projection;
  }
}

function applyLifecycleActive(health: SipSessionHealth): SipSessionHealth {
  if (health.lifecycle === "active") {
    return health;
  }
  return applyTransportTransition(
    { ...health, lifecycle: "active" },
    "session_activated",
    { lifecycle: "active" },
  );
}

function applyRegistrationRequested(health: SipSessionHealth): SipSessionHealth {
  const next = applyLifecycleActive(health);
  const clearedRecovery = {
    ...next.recovery,
    lastFailureReason: null,
  };
  if (next.transport === "connected") {
    return {
      ...next,
      registration: "registering",
      recovery: clearedRecovery,
    };
  }
  return {
    ...next,
    registration: next.transport === "idle" ? "idle" : "registering",
    recovery: clearedRecovery,
  };
}

function applyTransportConnected(health: SipSessionHealth): SipSessionHealth {
  const transitioned = applyTransportTransition(health, "transport_connected", {
    lifecycle: "active",
  });
  return {
    ...transitioned,
    recovery:
      transitioned.recovery.target === "transport"
        ? EMPTY_SIP_RECOVERY_SNAPSHOT
        : transitioned.recovery,
  };
}

function applyTransportDisconnected(
  health: SipSessionHealth,
  reason: string | null,
): SipSessionHealth {
  const lost = applySipTransportLoss(applyLifecycleActive(health));
  return {
    ...lost,
    recovery: {
      ...lost.recovery,
      lastFailureReason: reason ?? lost.recovery.lastFailureReason,
    },
  };
}

function applyTransportReconnectAttemptStarted(
  health: SipSessionHealth,
  event: DomainEvent,
): SipSessionHealth {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  return {
    ...applyLifecycleActive(health),
    transport: "connecting",
    registration: "idle",
    recovery: {
      target: "transport",
      attemptNumber: attemptNumber ?? health.recovery.attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: null,
    },
  };
}

function applyTransportReconnectSucceeded(health: SipSessionHealth): SipSessionHealth {
  return {
    ...applyLifecycleActive(health),
    transport: "connected",
    recovery: EMPTY_SIP_RECOVERY_SNAPSHOT,
  };
}

function applyTransportReconnectFailed(
  health: SipSessionHealth,
  event: DomainEvent,
): SipSessionHealth {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]) ?? health.recovery.attemptNumber;
  const reason = asOptionalString(event["reason"]) ?? "sip_transport_recovery_failed";
  const isTerminal = event["isTerminal"] === true;

  if (isTerminal) {
    return {
      ...applyLifecycleActive(health),
      transport: "disconnected",
      registration: "idle",
      recovery: {
        target: "transport",
        attemptNumber,
        maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
        nextRetryAt: null,
        lastFailureReason: reason,
      },
    };
  }

  return {
    ...applyLifecycleActive(health),
    transport: "reconnecting",
    registration: "idle",
    recovery: {
      target: "transport",
      attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: reason,
    },
  };
}

function applyManualTransportReconnect(health: SipSessionHealth): SipSessionHealth {
  const attemptNumber = health.recovery.attemptNumber > 0 ? health.recovery.attemptNumber : 1;
  return {
    ...applyTransportTransition(health, "transport_reconnect_scheduled", { lifecycle: "active" }),
    registration: "idle",
    recovery: {
      target: "transport",
      attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: null,
    },
  };
}

function applyManualReregister(health: SipSessionHealth): SipSessionHealth {
  if (health.transport !== "connected") {
    return health;
  }
  const attemptNumber = health.recovery.attemptNumber > 0 ? health.recovery.attemptNumber : 1;
  return {
    ...health,
    registration: "registering",
    recovery: {
      target: "registration",
      attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: null,
    },
  };
}

function applyRegistrationSucceeded(health: SipSessionHealth): SipSessionHealth {
  return {
    ...applyLifecycleActive(health),
    transport: health.transport === "idle" ? "connected" : health.transport,
    registration: "registered",
    recovery: EMPTY_SIP_RECOVERY_SNAPSHOT,
  };
}

function applyRegistrationFailed(
  health: SipSessionHealth,
  reason: string | null,
): SipSessionHealth {
  return {
    ...applyLifecycleActive(health),
    registration: "failed",
    recovery: {
      target: "registration",
      attemptNumber: health.recovery.attemptNumber,
      maxAttempts: health.recovery.maxAttempts,
      nextRetryAt: null,
      lastFailureReason: reason,
    },
  };
}

function applyRegistrationRetryAttemptStarted(
  health: SipSessionHealth,
  event: DomainEvent,
): SipSessionHealth {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  return {
    ...applyLifecycleActive(health),
    transport: "connected",
    registration: "registering",
    recovery: {
      target: "registration",
      attemptNumber: attemptNumber ?? health.recovery.attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: null,
    },
  };
}

function applyRegistrationRetrySucceeded(health: SipSessionHealth): SipSessionHealth {
  return applyRegistrationSucceeded(health);
}

function applyRegistrationRetryFailed(
  health: SipSessionHealth,
  event: DomainEvent,
): SipSessionHealth {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]) ?? health.recovery.attemptNumber;
  const reason = asOptionalString(event["reason"]) ?? "sip_registration_recovery_failed";
  const isTerminal = event["isTerminal"] === true;

  if (isTerminal) {
    return {
      ...applyLifecycleActive(health),
      registration: "failed",
      recovery: {
        target: "registration",
        attemptNumber,
        maxAttempts: health.recovery.maxAttempts,
        nextRetryAt: null,
        lastFailureReason: reason,
      },
    };
  }

  return {
    ...applyLifecycleActive(health),
    transport: "connected",
    registration: "failed",
    recovery: {
      target: "registration",
      attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: null,
      lastFailureReason: reason,
    },
  };
}

function applyRecoveryScheduled(
  health: SipSessionHealth,
  target: SipRecoveryTarget,
  event: DomainEvent,
): SipSessionHealth {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  const delayMs = parseDelayMs(event["delayMs"]);
  if (attemptNumber === null || delayMs === null) {
    return health;
  }

  const transportEvent =
    target === "transport" ? "transport_reconnect_scheduled" : null;
  const transitioned =
    transportEvent !== null
      ? applyTransportTransition(health, transportEvent, { lifecycle: "active" })
      : applyLifecycleActive(health);
  const transport =
    target === "transport" &&
    (transitioned.transport === "idle" || transitioned.transport === "disconnected")
      ? "reconnecting"
      : transitioned.transport;

  return {
    ...transitioned,
    lifecycle: "active",
    transport,
    registration: target === "transport" ? "idle" : transitioned.registration,
    recovery: {
      target,
      attemptNumber,
      maxAttempts: health.recovery.maxAttempts || DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
      nextRetryAt: computeNextRetryAt(event.occurredAt, delayMs),
      lastFailureReason: null,
    },
  };
}

type TransportTransitionOptions = Readonly<{
  lifecycle?: "active";
}>;

function applyTransportTransition(
  health: SipSessionHealth,
  event: Parameters<typeof transitionSipTransportState>[1],
  options: TransportTransitionOptions = {},
): SipSessionHealth {
  const result = transitionSipTransportState(health.transport, event);
  const lifecycle = options.lifecycle ?? health.lifecycle;
  if (!result.ok) {
    return { ...health, lifecycle };
  }
  return {
    ...health,
    lifecycle,
    transport: result.state,
  };
}

function computeNextRetryAt(occurredAt: string, delayMs: number): string {
  const baseMs = Date.parse(occurredAt);
  const startMs = Number.isNaN(baseMs) ? Date.now() : baseMs;
  return new Date(startMs + delayMs).toISOString();
}

function parseAttemptNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

function parseDelayMs(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
