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

export type HeaderChromeShellInput = Readonly<{
  authUiState: AuthUiState;
  registrationState: RegistrationState;
  phoneStatus: PhoneStatus;
  agentId: string | null;
  connectionState?: ConnectionState;
  sipRecoveryMode?: SipRecoveryMode | null;
}>;

export type HeaderChromeShellViewModel = Readonly<{
  registrationDotVariant: RegistrationDotVariant;
  registrationStatusLabel: string;
  phoneStatusLabel: string;
  avatarInitials: string;
  registrationDotAriaLabel: string;
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

function deriveAvatarInitials(agentId: string | null): string {
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

  return {
    registrationDotVariant,
    registrationStatusLabel,
    phoneStatusLabel: phoneLabel,
    avatarInitials: deriveAvatarInitials(input.agentId),
    registrationDotAriaLabel: `Регистрация: ${registrationStatusLabel}, телефон: ${phoneLabel}`,
  };
}
