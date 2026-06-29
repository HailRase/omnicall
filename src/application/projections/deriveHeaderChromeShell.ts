import { phoneStatusLabel } from "@domain/index.js";
import type { PhoneStatus, RegistrationState } from "@domain/index.js";
import type { AuthUiState } from "./accountBootstrapProjection.js";
import type { ConnectionState, SipRecoveryMode } from "./connectionRecoveryProjection.js";

export type RegistrationDotVariant =
  | "registering"
  | "registered_online"
  | "registered_offline"
  | "registered_dnd"
  | "failed"
  | "not_registered";

export type PresenceStatusTone = "online" | "offline" | "dnd";

export type HeaderChromeShellInput = Readonly<{
  authUiState: AuthUiState;
  registrationState: RegistrationState;
  phoneStatus: PhoneStatus;
  agentId: string | null;
  sipUsername: string | null;
  connectionState?: ConnectionState;
  sipRecoveryMode?: SipRecoveryMode | null;
}>;

export type HeaderChromeShellViewModel = Readonly<{
  registrationDotVariant: RegistrationDotVariant;
  registrationStatusLabel: string;
  phoneStatusLabel: string;
  avatarInitials: string;
  registrationDotAriaLabel: string;
  showUserIdentity: boolean;
  displayName: string | null;
  presenceStatusLabel: string | null;
  presenceStatusTone: PresenceStatusTone | null;
}>;

function deriveRegistrationStatusLabel(
  authUiState: AuthUiState,
  registrationState: RegistrationState,
): string {
  if (authUiState === "sip_registering") {
    return "Регистрация";
  }

  switch (registrationState) {
    case "registered":
      return "Зарегистрирован";
    case "failed":
      return "Ошибка";
    case "registering":
      return "Регистрация";
    default:
      return "Не зарегистрирован";
  }
}

function deriveRegistrationDotVariant(
  authUiState: AuthUiState,
  registrationState: RegistrationState,
  phoneStatus: PhoneStatus,
  connectionState: ConnectionState = "connected",
  sipRecoveryMode: SipRecoveryMode | null = null,
): RegistrationDotVariant {
  if (authUiState === "sip_registering" || registrationState === "registering") {
    return "registering";
  }

  if (
    connectionState === "reconnecting" &&
    sipRecoveryMode === "registration"
  ) {
    return "registering";
  }

  if (authUiState === "sip_registration_failed" || registrationState === "failed") {
    return "failed";
  }

  if (connectionState === "sip_disconnected" || connectionState === "reconnect_failed") {
    return "failed";
  }

  if (connectionState === "sip_registration_failed") {
    return "failed";
  }

  if (authUiState === "sip_registered" || registrationState === "registered") {
    if (phoneStatus === "dnd") {
      return "registered_dnd";
    }
    if (phoneStatus === "offline") {
      return "registered_offline";
    }
    return "registered_online";
  }

  return "not_registered";
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

function derivePresenceStatus(
  phoneStatus: PhoneStatus,
): Readonly<{ label: string; tone: PresenceStatusTone }> {
  switch (phoneStatus) {
    case "online":
      return { label: "Онлайн", tone: "online" };
    case "offline":
      return { label: "Оффлайн", tone: "offline" };
    case "dnd":
      return { label: "Не беспокоить", tone: "dnd" };
  }
}

/**
 * - Purpose: derive header chrome view-model for avatar, registration dot, and labels.
 * - Inputs: account bootstrap projection fields.
 * - Outputs: compact registration variant, labels, and avatar initials for shell header.
 */
export function deriveHeaderChromeShell(
  input: HeaderChromeShellInput,
): HeaderChromeShellViewModel {
  const registrationStatusLabel = deriveRegistrationStatusLabel(
    input.authUiState,
    input.registrationState,
  );
  const registrationDotVariant = deriveRegistrationDotVariant(
    input.authUiState,
    input.registrationState,
    input.phoneStatus,
    input.connectionState ?? "connected",
    input.sipRecoveryMode ?? null,
  );
  const phoneLabel = phoneStatusLabel(input.phoneStatus);
  const sipUsername =
    input.sipUsername !== null && input.sipUsername.trim().length > 0
      ? input.sipUsername.trim()
      : null;
  const presence = derivePresenceStatus(input.phoneStatus);

  return {
    registrationDotVariant,
    registrationStatusLabel,
    phoneStatusLabel: phoneLabel,
    avatarInitials: deriveAvatarInitials(sipUsername, input.agentId),
    registrationDotAriaLabel: `Регистрация: ${registrationStatusLabel}, телефон: ${phoneLabel}`,
    showUserIdentity: sipUsername !== null,
    displayName: sipUsername,
    presenceStatusLabel: sipUsername !== null ? presence.label : null,
    presenceStatusTone: sipUsername !== null ? presence.tone : null,
  };
}
