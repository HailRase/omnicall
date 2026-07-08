import {
  getEffectiveRegistrationState,
  type SipRegistrationState,
  type SipSessionHealth,
  type SipTransportState,
} from "@domain/index.js";
import type { SipConnectionJournalEntry } from "../../services/recovery/SipConnectionJournal.js";
import { deriveSipStatusShell, type SipStatusLabelKey } from "./deriveSipStatusShell.js";

export type SipTransportStateLabelKey =
  | "settings.systemState.transport.idle"
  | "settings.systemState.transport.connecting"
  | "settings.systemState.transport.connected"
  | "settings.systemState.transport.reconnecting"
  | "settings.systemState.transport.disconnected";

export type SipRegistrationStateLabelKey =
  | "settings.systemState.registration.idle"
  | "settings.systemState.registration.registering"
  | "settings.systemState.registration.registered"
  | "settings.systemState.registration.failed";

export type SipManualTransportDisabledReasonKey =
  | "settings.systemState.manualTransport.disabled.sessionInactive"
  | "settings.systemState.manualTransport.disabled.alreadyConnected"
  | "settings.systemState.manualTransport.disabled.reconnectInProgress";

export type SipManualReregisterDisabledReasonKey =
  | "settings.systemState.manualReregister.disabled.sessionInactive"
  | "settings.systemState.manualReregister.disabled.serverNotConnected"
  | "settings.systemState.manualReregister.disabled.registrationInProgress";

export type SipSystemStateShellInput = Readonly<{
  health: SipSessionHealth;
  sipAutoReconnectEnabled: boolean;
  sipAutoReregisterEnabled: boolean;
  journalEntries?: ReadonlyArray<SipConnectionJournalEntry>;
  nowMs?: number;
}>;

export type SipSystemStateShellView = Readonly<{
  transportState: SipTransportState;
  registrationState: SipRegistrationState;
  effectiveRegistrationState: SipRegistrationState;
  transportStateLabelKey: SipTransportStateLabelKey;
  registrationStateLabelKey: SipRegistrationStateLabelKey;
  summaryLabelKey: SipStatusLabelKey;
  transportFailureReason: string | null;
  registrationFailureReason: string | null;
  manualTransportReconnectDisabledReasonKey: SipManualTransportDisabledReasonKey | null;
  manualReregisterDisabledReasonKey: SipManualReregisterDisabledReasonKey | null;
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
}>;

/**
 * - Purpose: derive settings system-state view-model with semantic label keys (ADR-0006).
 * - Inputs: session health, recovery policy toggles, optional journal entries.
 * - Outputs: axis label keys, summary mirror, manual action disabled reason keys.
 */
export function deriveSipSystemStateShell(
  input: SipSystemStateShellInput,
): SipSystemStateShellView {
  const effectiveRegistration = getEffectiveRegistrationState(input.health);
  const summary = deriveSipStatusShell({
    health: input.health,
    sipAutoReconnectEnabled: input.sipAutoReconnectEnabled,
    sipAutoReregisterEnabled: input.sipAutoReregisterEnabled,
    ...(input.nowMs !== undefined ? { nowMs: input.nowMs } : {}),
  });

  return {
    transportState: input.health.transport,
    registrationState: input.health.registration,
    effectiveRegistrationState: effectiveRegistration,
    transportStateLabelKey: deriveTransportStateLabelKey(input.health.transport),
    registrationStateLabelKey: deriveRegistrationStateLabelKey(effectiveRegistration),
    summaryLabelKey: summary.primaryLabelKey,
    transportFailureReason:
      input.health.recovery.target === "transport"
        ? input.health.recovery.lastFailureReason
        : null,
    registrationFailureReason:
      input.health.recovery.target === "registration" ||
      effectiveRegistration === "failed"
        ? input.health.recovery.lastFailureReason
        : null,
    manualTransportReconnectDisabledReasonKey: deriveManualTransportReconnectDisabledReasonKey(
      input.health,
    ),
    manualReregisterDisabledReasonKey: deriveManualReregisterDisabledReasonKey(input.health),
    journalEntries: input.journalEntries ?? [],
  };
}

function deriveTransportStateLabelKey(state: SipTransportState): SipTransportStateLabelKey {
  switch (state) {
    case "idle":
      return "settings.systemState.transport.idle";
    case "connecting":
      return "settings.systemState.transport.connecting";
    case "connected":
      return "settings.systemState.transport.connected";
    case "reconnecting":
      return "settings.systemState.transport.reconnecting";
    case "disconnected":
      return "settings.systemState.transport.disconnected";
  }
}

function deriveRegistrationStateLabelKey(
  state: SipRegistrationState,
): SipRegistrationStateLabelKey {
  switch (state) {
    case "idle":
      return "settings.systemState.registration.idle";
    case "registering":
      return "settings.systemState.registration.registering";
    case "registered":
      return "settings.systemState.registration.registered";
    case "failed":
      return "settings.systemState.registration.failed";
  }
}

function deriveManualTransportReconnectDisabledReasonKey(
  health: SipSessionHealth,
): SipManualTransportDisabledReasonKey | null {
  if (health.lifecycle === "idle") {
    return "settings.systemState.manualTransport.disabled.sessionInactive";
  }
  if (health.transport === "connected") {
    return "settings.systemState.manualTransport.disabled.alreadyConnected";
  }
  if (health.transport === "connecting" || health.transport === "reconnecting") {
    return "settings.systemState.manualTransport.disabled.reconnectInProgress";
  }
  return null;
}

function deriveManualReregisterDisabledReasonKey(
  health: SipSessionHealth,
): SipManualReregisterDisabledReasonKey | null {
  if (health.lifecycle === "idle") {
    return "settings.systemState.manualReregister.disabled.sessionInactive";
  }
  if (health.transport !== "connected") {
    return "settings.systemState.manualReregister.disabled.serverNotConnected";
  }
  if (health.registration === "registering") {
    return "settings.systemState.manualReregister.disabled.registrationInProgress";
  }
  return null;
}
