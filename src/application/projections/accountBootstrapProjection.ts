import type { DomainEvent } from "@domain/index.js";
import {
  initialOcpConnectionState,
  initialOperatorAuthState,
  initialRegistrationState,
  transitionOcpConnectionState,
  transitionOperatorAuthState,
  transitionRegistrationState,
  type OcpConnectionState,
  type OperatorAuthState,
  type PhoneStatus,
  type RegistrationState,
  type StartupResolution,
} from "@domain/index.js";

export type AuthUiState =
  | "booting"
  | "sip_only_ready"
  | "ocp_authenticating"
  | "ocp_session_exists"
  | "ocp_invalid_token"
  | "access_denied"
  | "sip_registering"
  | "sip_registered"
  | "sip_registration_failed";

export type AccountBootstrapProjection = Readonly<{
  authUiState: AuthUiState;
  registrationState: RegistrationState;
  operatorAuthState: OperatorAuthState;
  ocpConnectionState: OcpConnectionState;
  phoneStatus: PhoneStatus;
  agentId: string | null;
  sipUsername: string | null;
  lastError: string | null;
  isOcpMode: boolean;
}>;

export const initialAccountBootstrapProjection = (): AccountBootstrapProjection => ({
  authUiState: "booting",
  registrationState: initialRegistrationState(),
  operatorAuthState: initialOperatorAuthState(),
  ocpConnectionState: initialOcpConnectionState(),
  phoneStatus: "offline",
  agentId: null,
  sipUsername: null,
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

function applyOperatorAuthEvent(
  projection: AccountBootstrapProjection,
  event: DomainEvent,
): AccountBootstrapProjection {
  switch (event.type) {
    case "OcpAuthenticationRequested": {
      const authTransition = transitionOperatorAuthState(
        projection.operatorAuthState,
        "auth_requested",
      );
      const connectionTransition = transitionOcpConnectionState(
        projection.ocpConnectionState,
        "connect_requested",
      );
      return {
        ...projection,
        authUiState: "ocp_authenticating",
        operatorAuthState: authTransition.state,
        ocpConnectionState: connectionTransition.state,
        lastError: null,
      };
    }
    case "OcpAuthenticationSucceeded": {
      const agentId =
        typeof event["agentId"] === "string" ? event["agentId"] : null;
      const authTransition = transitionOperatorAuthState(
        projection.operatorAuthState,
        "auth_succeeded",
      );
      const connectionTransition = transitionOcpConnectionState(
        projection.ocpConnectionState,
        "connected",
      );
      return {
        ...projection,
        agentId,
        operatorAuthState: authTransition.state,
        ocpConnectionState: connectionTransition.state,
        lastError: null,
      };
    }
    case "OcpAuthenticationFailed": {
      const reason = event["reason"];
      const message =
        typeof event["message"] === "string" ? event["message"] : "OCP auth failed";

      const authTransition = transitionOperatorAuthState(
        projection.operatorAuthState,
        "auth_failed",
      );
      const connectionTransition = transitionOcpConnectionState(
        projection.ocpConnectionState,
        "disconnected",
      );

      const base = {
        ...projection,
        operatorAuthState: authTransition.state,
        ocpConnectionState: connectionTransition.state,
        lastError: message,
      };

      if (reason === "access_denied") {
        return base;
      }

      if (reason === "session_exists") {
        return { ...base, authUiState: "ocp_session_exists" };
      }

      if (reason === "invalid_token") {
        return { ...base, authUiState: "ocp_invalid_token" };
      }

      return { ...base, authUiState: "ocp_invalid_token" };
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
          isOcpMode: false,
          lastError: null,
        };
      }

      if (resolution.action === "ocp_authenticate") {
        return {
          ...projection,
          isOcpMode: true,
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
        lastError: null,
      };
    }
    case "SipCredentialsReceived": {
      const credentials = event["credentials"];
      if (typeof credentials !== "object" || credentials === null) {
        return projection;
      }
      const username = (credentials as Record<string, unknown>)["username"];
      if (typeof username !== "string" || username.trim().length === 0) {
        return projection;
      }
      return {
        ...projection,
        sipUsername: username.trim(),
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
  const afterAuth = applyOperatorAuthEvent(afterBootstrap, event);
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
