import type { SipSessionHealth } from "@domain/index.js";
import {
  deriveSipStatusShell,
  type SipStatusDotTone,
  type SipStatusLabelKey,
} from "./deriveSipStatusShell.js";

export type RegistrationDotVariant =
  | "registering"
  | "registered_online"
  | "registered_offline"
  | "registered_dnd"
  | "failed"
  | "not_registered";

export type HeaderChromeShellInput = Readonly<{
  health: SipSessionHealth;
  agentId: string | null;
  sipUsername: string | null;
  dndEnabled?: boolean;
  sipAutoReconnectEnabled?: boolean;
  sipAutoReregisterEnabled?: boolean;
  nowMs?: number;
}>;

export type HeaderChromeShellViewModel = Readonly<{
  registrationDotVariant: RegistrationDotVariant;
  registrationDotAriaLabelKey: "header.sipStatus.aria" | "header.sipStatus.ariaWithRetry";
  registrationDotAriaLabelParams: Readonly<{ statusKey: SipStatusLabelKey; timer?: string }>;
  avatarInitials: string;
  showUserIdentity: boolean;
  displayName: string | null;
  sipStatusLabelKey: SipStatusLabelKey | null;
  sipStatusTimerSuffix: string | null;
  sipStatusTone: SipStatusDotTone | null;
}>;

function mapDotToneToVariant(tone: SipStatusDotTone): RegistrationDotVariant {
  switch (tone) {
    case "idle":
      return "not_registered";
    case "connecting":
    case "registering":
      return "registering";
    case "reconnecting":
    case "disconnected":
      return "failed";
    case "not_registered":
      return "not_registered";
    case "registered":
      return "registered_online";
    case "dnd":
      return "registered_dnd";
  }
}

function deriveAvatarInitials(
  sipUsername: string | null,
  agentId: string | null,
): string {
  if (sipUsername !== null && sipUsername.trim().length > 0) {
    return sipUsername.trim().slice(0, 2).toUpperCase();
  }

  if (agentId === null || agentId.trim().length === 0) {
    return "?";
  }

  const trimmed = agentId.trim();
  const parts = trimmed.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length >= 2) {
    return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * - Purpose: derive header chrome view-model from SIP session health (ADR-0004 §4).
 * - Inputs: SipSessionHealth, identity fields, recovery toggles, clock.
 * - Outputs: dot variant, SIP status keys, and avatar initials for shell header.
 */
export function deriveHeaderChromeShell(
  input: HeaderChromeShellInput,
): HeaderChromeShellViewModel {
  const sipStatus = deriveSipStatusShell({
    health: input.health,
    ...(input.dndEnabled !== undefined ? { dndEnabled: input.dndEnabled } : {}),
    ...(input.sipAutoReconnectEnabled !== undefined
      ? { sipAutoReconnectEnabled: input.sipAutoReconnectEnabled }
      : {}),
    ...(input.sipAutoReregisterEnabled !== undefined
      ? { sipAutoReregisterEnabled: input.sipAutoReregisterEnabled }
      : {}),
    ...(input.nowMs !== undefined ? { nowMs: input.nowMs } : {}),
  });
  const sipUsername =
    input.sipUsername !== null && input.sipUsername.trim().length > 0
      ? input.sipUsername.trim()
      : null;

  const ariaLabelKey =
    sipStatus.timerSuffix === null
      ? ("header.sipStatus.aria" as const)
      : ("header.sipStatus.ariaWithRetry" as const);
  const ariaLabelParams =
    sipStatus.timerSuffix === null
      ? { statusKey: sipStatus.primaryLabelKey }
      : { statusKey: sipStatus.primaryLabelKey, timer: sipStatus.timerSuffix };

  return {
    registrationDotVariant: mapDotToneToVariant(sipStatus.dotTone),
    registrationDotAriaLabelKey: ariaLabelKey,
    registrationDotAriaLabelParams: ariaLabelParams,
    avatarInitials: deriveAvatarInitials(sipUsername, input.agentId),
    showUserIdentity: sipUsername !== null,
    displayName: sipUsername,
    sipStatusLabelKey: sipUsername !== null ? sipStatus.primaryLabelKey : null,
    sipStatusTimerSuffix: sipUsername !== null ? sipStatus.timerSuffix : null,
    sipStatusTone: sipUsername !== null ? sipStatus.dotTone : null,
  };
}
