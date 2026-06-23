import type { DomainEvent } from "@domain/index.js";
import {
  initialRegistrationState,
  transitionRegistrationState,
  type PhoneStatus,
  type RegistrationState,
} from "@domain/index.js";

export type AuthUiState =
  | "booting"
  | "sip_only_ready"
  | "ocp_authenticating"
  | "ocp_session_exists"
  | "ocp_invalid_token"
  | "ocp_access_denied"
  | "sip_registering"
  | "sip_registered"
  | "sip_registration_failed";

export type AccountBootstrapProjection = Readonly<{
  authUiState: AuthUiState;
  registrationState: RegistrationState;
  phoneStatus: PhoneStatus;
  agentId: string | null;
  lastError: string | null;
  isOcpMode: boolean;
}>;

export const initialAccountBootstrapProjection = (): AccountBootstrapProjection => ({
  authUiState: "booting",
  registrationState: initialRegistrationState(),
  phoneStatus: "offline",
  agentId: null,
  lastError: null,
  isOcpMode: false,
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
      return {
        ...projection,
        authUiState: "sip_registering",
        registrationState: transition.state,
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
    default:
      return projection;
  }
}

function applyOperatorAuthEvent(
  projection: AccountBootstrapProjection,
  event: DomainEvent,
): AccountBootstrapProjection {
  switch (event.type) {
    case "OcpAuthenticationRequested":
      return {
        ...projection,
        authUiState: "ocp_authenticating",
        lastError: null,
      };
    case "OcpAuthenticationSucceeded": {
      const agentId =
        typeof event["agentId"] === "string" ? event["agentId"] : null;
      return {
        ...projection,
        agentId,
        lastError: null,
      };
    }
    case "OcpAuthenticationFailed": {
      const reason = event["reason"];
      const message =
        typeof event["message"] === "string" ? event["message"] : "OCP auth failed";

      if (reason === "session_exists") {
        return {
          ...projection,
          authUiState: "ocp_session_exists",
          lastError: message,
        };
      }

      if (reason === "invalid_token") {
        return {
          ...projection,
          authUiState: "ocp_invalid_token",
          lastError: message,
        };
      }

      if (reason === "access_denied") {
        return {
          ...projection,
          authUiState: "ocp_access_denied",
          lastError: message,
        };
      }

      return {
        ...projection,
        authUiState: "ocp_access_denied",
        lastError: message,
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
  const afterAuth = applyOperatorAuthEvent(projection, event);
  const afterRegistration = applyRegistrationEvent(afterAuth, event);
  return afterRegistration;
}

export function setBootstrapMode(
  projection: AccountBootstrapProjection,
  isOcpMode: boolean,
): AccountBootstrapProjection {
  return {
    ...projection,
    isOcpMode,
    authUiState: isOcpMode ? projection.authUiState : "sip_only_ready",
  };
}

export function setPhoneStatusProjection(
  projection: AccountBootstrapProjection,
  phoneStatus: PhoneStatus,
): AccountBootstrapProjection {
  return {
    ...projection,
    phoneStatus,
  };
}
