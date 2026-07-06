import type { SipSystemStateShellView } from "@application/index.js";

export const idleSystemStateShell: SipSystemStateShellView = {
  transportState: "idle",
  registrationState: "idle",
  effectiveRegistrationState: "idle",
  transportStateLabelKey: "settings.systemState.transport.idle",
  registrationStateLabelKey: "settings.systemState.registration.idle",
  summaryLabelKey: "header.sipStatus.notConnected",
  transportFailureReason: null,
  registrationFailureReason: null,
  manualTransportReconnectDisabledReasonKey:
    "settings.systemState.manualTransport.disabled.sessionInactive",
  manualReregisterDisabledReasonKey:
    "settings.systemState.manualReregister.disabled.sessionInactive",
  journalEntries: [],
};

export const systemStateTestDefaults = {
  shell: idleSystemStateShell,
  sipAutoReconnectEnabled: true,
  onSipAutoReconnectChange: () => undefined,
  sipReconnectIntervalSec: 5,
  onSipReconnectIntervalChange: () => undefined,
  sipReconnectMaxAttempts: 5,
  onSipReconnectMaxAttemptsChange: () => undefined,
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: () => undefined,
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: () => undefined,
  sipReregisterMaxAttempts: 5,
  onSipReregisterMaxAttemptsChange: () => undefined,
  sipAutoRegisterOnStartup: false,
  onSipAutoRegisterOnStartupChange: () => undefined,
  onManualTransportReconnect: () => undefined,
  onManualReregister: () => undefined,
  onClearJournal: () => undefined,
  actionLoading: null,
} as const;
