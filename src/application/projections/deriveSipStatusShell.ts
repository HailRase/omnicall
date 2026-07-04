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

export type SipStatusLabelKey =
  | "header.sipStatus.notConnected"
  | "header.sipStatus.connecting"
  | "header.sipStatus.noConnection"
  | "header.sipStatus.notRegistered"
  | "header.sipStatus.registered"
  | "header.sipStatus.dnd";

export type SipStatusShellInput = Readonly<{
  health: SipSessionHealth;
  dndEnabled?: boolean;
  sipAutoReconnectEnabled?: boolean;
  sipAutoReregisterEnabled?: boolean;
  nowMs?: number;
}>;

export type SipStatusShellView = Readonly<{
  dotTone: SipStatusDotTone;
  primaryLabelKey: SipStatusLabelKey;
  timerSuffix: string | null;
}>;

/**
 * - Purpose: derive header SIP status line from session health (ADR-0004 §1.2).
 * - Inputs: SipSessionHealth, DND flag, auto-recovery toggles, clock.
 * - Outputs: dot tone, semantic label key, optional retry timer suffix.
 */
export function deriveSipStatusShell(input: SipStatusShellInput): SipStatusShellView {
  const nowMs = input.nowMs ?? Date.now();
  const dndEnabled = input.dndEnabled === true;
  const effectiveRegistration = getEffectiveRegistrationState(input.health);

  if (input.health.lifecycle === "idle") {
    return buildView("idle", "header.sipStatus.notConnected", null);
  }

  const transport = input.health.transport;

  if (transport === "connecting") {
    return buildView("connecting", "header.sipStatus.connecting", null);
  }

  if (transport === "reconnecting") {
    const suffix =
      input.sipAutoReconnectEnabled === false
        ? null
        : formatRetrySuffix(input.health.recovery.nextRetryAt, nowMs);
    return buildView("reconnecting", "header.sipStatus.noConnection", suffix);
  }

  if (transport === "disconnected") {
    return buildView("disconnected", "header.sipStatus.noConnection", null);
  }

  if (
    input.health.registration === "registering" &&
    (transport === "idle" || transport === "connected")
  ) {
    return buildView("registering", "header.sipStatus.connecting", null);
  }

  if (effectiveRegistration === "registering") {
    return buildView("registering", "header.sipStatus.connecting", null);
  }

  if (effectiveRegistration === "failed") {
    const suffix =
      input.sipAutoReregisterEnabled === false
        ? null
        : formatRetrySuffix(input.health.recovery.nextRetryAt, nowMs);
    return buildView("not_registered", "header.sipStatus.notRegistered", suffix);
  }

  if (effectiveRegistration === "idle" && transport === "connected") {
    const suffix =
      input.health.recovery.target === "registration" &&
      input.sipAutoReregisterEnabled !== false
        ? formatRetrySuffix(input.health.recovery.nextRetryAt, nowMs)
        : null;
    return buildView("not_registered", "header.sipStatus.notRegistered", suffix);
  }

  if (isEffectivelyRegistered(input.health)) {
    if (dndEnabled) {
      return buildView("dnd", "header.sipStatus.dnd", null);
    }
    return buildView("registered", "header.sipStatus.registered", null);
  }

  return buildView("not_registered", "header.sipStatus.notRegistered", null);
}

function buildView(
  dotTone: SipStatusDotTone,
  primaryLabelKey: SipStatusLabelKey,
  timerSuffix: string | null,
): SipStatusShellView {
  return {
    dotTone,
    primaryLabelKey,
    timerSuffix,
  };
}

function formatRetrySuffix(
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
