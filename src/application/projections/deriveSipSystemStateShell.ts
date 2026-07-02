import {
  getEffectiveRegistrationState,
  type SipRegistrationState,
  type SipSessionHealth,
  type SipTransportState,
} from "@domain/index.js";
import type { SipConnectionJournalEntry } from "../services/SipConnectionJournal.js";
import { deriveSipStatusShell } from "./deriveSipStatusShell.js";

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
  transportStateLabel: string;
  registrationStateLabel: string;
  summaryLabel: string;
  transportFailureReason: string | null;
  registrationFailureReason: string | null;
  manualTransportReconnectDisabledReason: string | null;
  manualReregisterDisabledReason: string | null;
  forceRefreshDisabledReason: string | null;
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
}>;

/**
 * - Purpose: derive settings «Состояние системы» view-model (ADR-0004 §5).
 * - Inputs: session health, recovery policy toggles, optional journal entries.
 * - Outputs: axis labels, summary mirror, manual action disabled reasons.
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
    transportStateLabel: deriveTransportStateLabel(input.health.transport),
    registrationStateLabel: deriveRegistrationStateLabel(effectiveRegistration),
    summaryLabel: summary.primaryLabel,
    transportFailureReason:
      input.health.recovery.target === "transport"
        ? input.health.recovery.lastFailureReason
        : null,
    registrationFailureReason:
      input.health.recovery.target === "registration" ||
      effectiveRegistration === "failed"
        ? input.health.recovery.lastFailureReason
        : null,
    manualTransportReconnectDisabledReason: deriveManualTransportReconnectDisabledReason(
      input.health,
    ),
    manualReregisterDisabledReason: deriveManualReregisterDisabledReason(input.health),
    forceRefreshDisabledReason: deriveForceRefreshDisabledReason(input.health),
    journalEntries: input.journalEntries ?? [],
  };
}

function deriveTransportStateLabel(state: SipTransportState): string {
  switch (state) {
    case "idle":
      return "Не активно";
    case "connecting":
      return "Подключение";
    case "connected":
      return "Подключён";
    case "reconnecting":
      return "Переподключение";
    case "disconnected":
      return "Отключён";
  }
}

function deriveRegistrationStateLabel(state: SipRegistrationState): string {
  switch (state) {
    case "idle":
      return "Не активна";
    case "registering":
      return "Регистрация";
    case "registered":
      return "Зарегистрирован";
    case "failed":
      return "Ошибка";
  }
}

function deriveManualTransportReconnectDisabledReason(
  health: SipSessionHealth,
): string | null {
  if (health.lifecycle === "idle") {
    return "Сессия не активна";
  }
  if (health.transport === "connecting" || health.transport === "reconnecting") {
    return "Переподключение выполняется";
  }
  return null;
}

function deriveManualReregisterDisabledReason(health: SipSessionHealth): string | null {
  if (health.lifecycle === "idle") {
    return "Сессия не активна";
  }
  if (health.transport !== "connected") {
    return "Сокет не подключён";
  }
  if (health.registration === "registering") {
    return "Регистрация выполняется";
  }
  return null;
}

function deriveForceRefreshDisabledReason(health: SipSessionHealth): string | null {
  const reregisterReason = deriveManualReregisterDisabledReason(health);
  if (reregisterReason !== null) {
    return reregisterReason;
  }
  if (health.registration !== "registered") {
    return "Регистрация не активна";
  }
  return null;
}
