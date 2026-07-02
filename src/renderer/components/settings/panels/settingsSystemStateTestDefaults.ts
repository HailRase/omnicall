import type { SipSystemStateShellView } from "@application/index.js";

export const idleSystemStateShell: SipSystemStateShellView = {
  transportState: "idle",
  registrationState: "idle",
  effectiveRegistrationState: "idle",
  transportStateLabel: "Неактивно",
  registrationStateLabel: "Неактивна",
  summaryLabel: "Не подключено",
  transportFailureReason: null,
  registrationFailureReason: null,
  manualTransportReconnectDisabledReason: "Сессия не активна",
  manualReregisterDisabledReason: "Сессия не активна",
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
  actionError: null,
  actionSuccess: null,
  actionLoading: null,
} as const;
