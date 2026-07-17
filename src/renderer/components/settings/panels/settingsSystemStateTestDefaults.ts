import type { OcpSystemStateShellView, SipSystemStateShellView } from "@application/index.js";

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

export const idleOcpSystemStateShell: OcpSystemStateShellView = {
  ocpModuleEnabled: true,
  tabDisabledReasonKey: null,
  serverState: "disconnected",
  authorizationState: { phase: "idle" },
  serverStateLabelKey: "settings.systemState.ocp.server.disconnected",
  authorizationStateLabelKey: "settings.systemState.ocp.authorization.idle",
  primaryRecoveryAction: null,
  allowedRecoveryActions: [],
  recoveryActionLabelKeys: {
    retry_server: "settings.systemState.ocp.action.retryServer",
    retry_authorization: "settings.systemState.ocp.action.retryAuthorization",
    reconnect: "settings.systemState.ocp.action.reconnect",
  },
};

export const systemStateTestDefaults = {
  shell: idleSystemStateShell,
  ocpShell: idleOcpSystemStateShell,
  ocpRecoveryActionLoading: null,
  onOcpRecoveryAction: () => undefined,
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
