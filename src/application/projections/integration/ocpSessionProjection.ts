/**
 * - Purpose: serializable OCP session/connection projection for Application + future SDK push.
 * - Inputs: OcpGateway connection states and Error entity messages.
 * - Outputs: auth/proxy/domain snapshot selectors.
 */

import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpErrorCode } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type OcpProxyStatus = "SESSION_EXIST" | "INVALID_TOKEN";

export type OcpSessionProjection = Readonly<{
  connectionState: OcpConnectionState;
  isAuthenticated: boolean;
  domain: string | null;
  proxyStatus: OcpProxyStatus | null;
  reconnectAttempt: number;
}>;

export function initialOcpSessionProjection(): OcpSessionProjection {
  return {
    connectionState: "disconnected",
    isAuthenticated: false,
    domain: null,
    proxyStatus: null,
    reconnectAttempt: 0,
  };
}

export function reduceOcpSessionFromConnectionState(
  projection: OcpSessionProjection,
  connectionState: OcpConnectionState,
): OcpSessionProjection {
  const reconnectAttempt =
    connectionState === "reconnecting"
      ? projection.reconnectAttempt + 1
      : connectionState === "authenticated" ||
          connectionState === "connected" ||
          connectionState === "disconnected"
        ? 0
        : projection.reconnectAttempt;

  return {
    ...projection,
    connectionState,
    isAuthenticated: connectionState === "authenticated",
    reconnectAttempt,
    proxyStatus:
      connectionState === "authenticated" || connectionState === "connected"
        ? null
        : projection.proxyStatus,
  };
}

export function reduceOcpSessionFromMessage(
  projection: OcpSessionProjection,
  message: OcpIncomingMessage,
): OcpSessionProjection {
  if (message.entity === "creds") {
    return {
      ...projection,
      domain: message.data.domain,
    };
  }

  if (message.entity === "Error") {
    return applyProxyError(projection, message.data.code);
  }

  if (message.entity === "terminate") {
    return {
      ...projection,
      connectionState: "sessionClosed",
      isAuthenticated: false,
      proxyStatus: null,
    };
  }

  return projection;
}

export function applyOcpSessionDomain(
  projection: OcpSessionProjection,
  domain: string,
): OcpSessionProjection {
  return {
    ...projection,
    domain,
  };
}

export function selectIsOcpConnected(projection: OcpSessionProjection): boolean {
  return (
    projection.connectionState === "connected" ||
    projection.connectionState === "authenticated"
  );
}

export function selectOcpProxyStatus(
  projection: OcpSessionProjection,
): OcpProxyStatus | null {
  return projection.proxyStatus;
}

export function selectOcpDomain(projection: OcpSessionProjection): string | null {
  return projection.domain;
}

function applyProxyError(
  projection: OcpSessionProjection,
  code: OcpErrorCode,
): OcpSessionProjection {
  if (code === "SESSION_EXIST") {
    return {
      ...projection,
      proxyStatus: "SESSION_EXIST",
      isAuthenticated: false,
    };
  }
  if (code === "INVALID_TOKEN") {
    return {
      ...projection,
      proxyStatus: "INVALID_TOKEN",
      isAuthenticated: false,
    };
  }
  return projection;
}
