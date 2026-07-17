import type { DomainEvent } from "@domain/index.js";
import {
  initialRegistrationState,
  normalizeSettingsAccountDomain,
  transitionRegistrationState,
  type PhoneStatus,
  type RegistrationState,
  type StartupResolution,
} from "@domain/index.js";

export type AuthUiState =
  | "booting"
  | "sip_only_ready"
  | "access_denied"
  | "sip_registering"
  | "sip_registered"
  | "sip_registration_failed";

export type AccountBootstrapProjection = Readonly<{
  authUiState: AuthUiState;
  registrationState: RegistrationState;
  phoneStatus: PhoneStatus;
  sipUsername: string | null;
  sipDomain: string | null;
  sipServer: string | null;
  lastError: string | null;
  /** Local account session active (settings unlocked); independent of SIP-ready (ADR-AF-005). */
  hasActiveAccountSession: boolean;
}>;

export const initialAccountBootstrapProjection = (): AccountBootstrapProjection => ({
  authUiState: "booting",
  registrationState: initialRegistrationState(),
  phoneStatus: "offline",
  sipUsername: null,
  sipDomain: null,
  sipServer: null,
  lastError: null,
  hasActiveAccountSession: false,
});

function applyRegistrationEvent(
  projection: AccountBootstrapProjection,
  event: DomainEvent,
): AccountBootstrapProjection {
  switch (event.type) {
    case "RegistrationRequested": {
      const transition = transitionRegistrationState(
        projection.registrationState,
        "registration_requested",
      );
      const accountId = event["accountId"];
      const sipUsername =
        typeof accountId === "string" && accountId.trim().length > 0
          ? accountId.trim()
          : projection.sipUsername;
      return {
        ...projection,
        authUiState: "sip_registering",
        registrationState: transition.state,
        sipUsername,
        lastError: null,
      };
    }
    case "RegistrationSucceeded": {
      const transition = transitionRegistrationState(
        projection.registrationState,
        "registration_succeeded",
      );
      return {
        ...projection,
        authUiState: "sip_registered",
        registrationState: transition.state,
        phoneStatus: projection.phoneStatus === "offline" ? "online" : projection.phoneStatus,
        lastError: null,
      };
    }
    case "RegistrationFailed": {
      const transition = transitionRegistrationState(
        projection.registrationState,
        "registration_failed",
      );
      const reason =
        typeof event["reason"] === "string" ? event["reason"] : "Registration failed";
      return {
        ...projection,
        authUiState: "sip_registration_failed",
        registrationState: transition.state,
        lastError: reason,
      };
    }
    case "UnregistrationSucceeded": {
      const transition = transitionRegistrationState(
        projection.registrationState,
        "unregister",
      );
      return {
        ...projection,
        registrationState: transition.state,
        lastError: null,
      };
    }
    case "UnregistrationFailed": {
      const reason =
        typeof event["reason"] === "string" ? event["reason"] : "Unregistration failed";
      return {
        ...projection,
        lastError: reason,
      };
    }
    default:
      return projection;
  }
}

function applyBootstrapEvent(
  projection: AccountBootstrapProjection,
  event: DomainEvent,
): AccountBootstrapProjection {
  switch (event.type) {
    case "StartupModeResolved": {
      const resolution = event["resolution"] as StartupResolution | undefined;
      if (resolution === undefined) {
        return projection;
      }

      if (resolution.action === "sip_only_ready") {
        return {
          ...projection,
          authUiState: "sip_only_ready",
          lastError: null,
        };
      }

      return projection;
    }
    case "AccessDeniedDetected": {
      const reason =
        typeof event["reason"] === "string" ? event["reason"] : "Access denied";
      return {
        ...projection,
        authUiState: "access_denied",
        lastError: reason,
      };
    }
    case "PhoneStatusChanged": {
      const nextStatus = event["nextStatus"];
      if (nextStatus !== "online" && nextStatus !== "offline" && nextStatus !== "dnd") {
        return projection;
      }
      return {
        ...projection,
        phoneStatus: nextStatus,
      };
    }
    case "UserSessionEnded": {
      const regTransition = transitionRegistrationState(
        projection.registrationState,
        "unregister",
      );
      return {
        ...projection,
        authUiState: "sip_only_ready",
        registrationState: regTransition.state,
        phoneStatus: "offline",
        sipUsername: null,
        sipDomain: null,
        sipServer: null,
        lastError: null,
        hasActiveAccountSession: false,
      };
    }
    case "AccountSessionActivated": {
      return {
        ...projection,
        hasActiveAccountSession: true,
      };
    }
    case "SipCredentialsReceived": {
      const credentials = event["credentials"];
      if (typeof credentials !== "object" || credentials === null) {
        return projection;
      }
      const record = credentials as Record<string, unknown>;
      const username = record["username"];
      const domain = record["domain"];
      const server = record["server"];
      if (typeof username !== "string" || username.trim().length === 0) {
        return projection;
      }
      const sipDomain =
        typeof domain === "string" && domain.trim().length > 0
          ? normalizeSettingsAccountDomain(domain)
          : null;
      const sipServer =
        typeof server === "string" && server.trim().length > 0 ? server.trim() : null;
      return {
        ...projection,
        sipUsername: username.trim(),
        sipDomain,
        sipServer,
      };
    }
    default:
      return projection;
  }
}

export function reduceAccountBootstrapProjection(
  projection: AccountBootstrapProjection,
  event: DomainEvent,
): AccountBootstrapProjection {
  const afterBootstrap = applyBootstrapEvent(projection, event);
  return applyRegistrationEvent(afterBootstrap, event);
}
