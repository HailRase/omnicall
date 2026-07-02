import {
  getEffectiveRegistrationState,
  isEffectivelyRegistered,
  type SipSessionHealth,
} from "@domain/index.js";
import { deriveAutoAnswerSecondsRemaining } from "./deriveAutoAnswerCountdown.js";

export type SipStatusDotTone =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "disconnected"
  | "registering"
  | "not_registered"
  | "registered"
  | "dnd";

export type SipStatusShellInput = Readonly<{
  health: SipSessionHealth;
  dndEnabled?: boolean;
  sipAutoReconnectEnabled?: boolean;
  sipAutoReregisterEnabled?: boolean;
  nowMs?: number;
}>;

export type SipStatusShellView = Readonly<{
  dotTone: SipStatusDotTone;
  primaryLabel: string;
  timerSuffix: string | null;
  ariaLabel: string;
}>;

/**
 * - Purpose: derive header SIP status line from session health (ADR-0004 §1.2).
 * - Inputs: SipSessionHealth, DND flag, auto-recovery toggles, clock.
 * - Outputs: dot tone, Russian label, optional retry timer suffix.
 */
export function deriveSipStatusShell(input: SipStatusShellInput): SipStatusShellView {
  const nowMs = input.nowMs ?? Date.now();
  const dndEnabled = input.dndEnabled === true;
  const effectiveRegistration = getEffectiveRegistrationState(input.health);

  if (input.health.lifecycle === "idle") {
    return buildView("idle", "Не подключено", null);
  }

  const transport = input.health.transport;

  if (transport === "connecting") {
    return buildView("connecting", "Соединение", null);
  }

  if (transport === "reconnecting") {
    const suffix =
      input.sipAutoReconnectEnabled === false
        ? null
        : formatRetrySuffix("переподкл.", input.health.recovery.nextRetryAt, nowMs);
    return buildView("reconnecting", "Нет соединения", suffix);
  }

  if (transport === "disconnected") {
    return buildView("disconnected", "Нет соединения", null);
  }

  if (
    input.health.registration === "registering" &&
    (transport === "idle" || transport === "connected")
  ) {
    return buildView("registering", "Соединение", null);
  }

  if (effectiveRegistration === "registering") {
    return buildView("registering", "Соединение", null);
  }

  if (effectiveRegistration === "failed") {
    const suffix =
      input.sipAutoReregisterEnabled === false
        ? null
        : formatRetrySuffix("перерег.", input.health.recovery.nextRetryAt, nowMs);
    return buildView("not_registered", "Не зарегистрирован", suffix);
  }

  if (effectiveRegistration === "idle" && transport === "connected") {
    const suffix =
      input.health.recovery.target === "registration" &&
      input.sipAutoReregisterEnabled !== false
        ? formatRetrySuffix("перерег.", input.health.recovery.nextRetryAt, nowMs)
        : null;
    return buildView("not_registered", "Не зарегистрирован", suffix);
  }

  if (isEffectivelyRegistered(input.health)) {
    if (dndEnabled) {
      return buildView("dnd", "Не беспокоить", null);
    }
    return buildView("registered", "Зарегистрирован", null);
  }

  return buildView("not_registered", "Не зарегистрирован", null);
}

function buildView(
  dotTone: SipStatusDotTone,
  primaryLabel: string,
  timerSuffix: string | null,
): SipStatusShellView {
  const ariaLabel =
    timerSuffix === null
      ? `SIP: ${primaryLabel}`
      : `SIP: ${primaryLabel}, повтор через ${timerSuffix}`;
  return {
    dotTone,
    primaryLabel,
    timerSuffix,
    ariaLabel,
  };
}

function formatRetrySuffix(
  _prefix: string,
  nextRetryAt: string | null,
  nowMs: number,
): string | null {
  const seconds = deriveAutoAnswerSecondsRemaining(nextRetryAt, nowMs);
  if (seconds === null) {
    return null;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(remainder).padStart(2, "0");
  return `${mm}:${ss}`;
}
