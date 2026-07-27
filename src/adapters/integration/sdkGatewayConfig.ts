/**
 * Loopback SDK gateway limits (DI-03 / ADR-0010).
 * Protocol frame/depth defaults come from `@softomnitel/omnicall-protocol`.
 */

import {
  DEFAULT_DISCOVERY_HOST,
  DEFAULT_DISCOVERY_PORT,
  DEFAULT_MAX_MESSAGE_BYTES,
} from "@softomnitel/omnicall-protocol";

/** Default IPv4 loopback bind host (ADR-0015). */
export const SDK_GATEWAY_DEFAULT_HOST = DEFAULT_DISCOVERY_HOST;

/** Default discovery / WS TCP port (ADR-0015). */
export const SDK_GATEWAY_DEFAULT_PORT = DEFAULT_DISCOVERY_PORT;

/** Heartbeat interval advertised in discovery / server-hello (seconds). */
export const SDK_GATEWAY_HEARTBEAT_SECONDS = 15;

/** Max simultaneous WS clients for the local SDK surface. */
export const SDK_GATEWAY_MAX_CONNECTIONS = 8;

/** Max outbound JSON frames waiting per connection before disconnect. */
export const SDK_GATEWAY_MAX_OUTBOUND_QUEUE = 16;

/** Sliding-window inbound message budget per connection. */
export const SDK_GATEWAY_RATE_LIMIT_MAX = 30;

/** Sliding-window duration for inbound rate limiting (ms). */
export const SDK_GATEWAY_RATE_LIMIT_WINDOW_MS = 10_000;

/** Must complete client-hello within this window after connect (ms). */
export const SDK_GATEWAY_HANDSHAKE_TIMEOUT_MS = 10_000;

/** Disconnect unauthenticated idle sessions after this idle period (ms). */
export const SDK_GATEWAY_UNAUTH_IDLE_MS = 60_000;

/** Frame size budget (bytes) — matches protocol default. */
export const SDK_GATEWAY_MAX_MESSAGE_BYTES = DEFAULT_MAX_MESSAGE_BYTES;

export type SdkGatewayLimits = Readonly<{
  maxConnections: number;
  maxOutboundQueue: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  handshakeTimeoutMs: number;
  unauthIdleMs: number;
  maxMessageBytes: number;
  heartbeatSeconds: number;
}>;

export const DEFAULT_SDK_GATEWAY_LIMITS: SdkGatewayLimits = {
  maxConnections: SDK_GATEWAY_MAX_CONNECTIONS,
  maxOutboundQueue: SDK_GATEWAY_MAX_OUTBOUND_QUEUE,
  rateLimitMax: SDK_GATEWAY_RATE_LIMIT_MAX,
  rateLimitWindowMs: SDK_GATEWAY_RATE_LIMIT_WINDOW_MS,
  handshakeTimeoutMs: SDK_GATEWAY_HANDSHAKE_TIMEOUT_MS,
  unauthIdleMs: SDK_GATEWAY_UNAUTH_IDLE_MS,
  maxMessageBytes: SDK_GATEWAY_MAX_MESSAGE_BYTES,
  heartbeatSeconds: SDK_GATEWAY_HEARTBEAT_SECONDS,
};

export function mergeSdkGatewayLimits(
  overrides?: Partial<SdkGatewayLimits>,
): SdkGatewayLimits {
  if (overrides === undefined) {
    return DEFAULT_SDK_GATEWAY_LIMITS;
  }
  return { ...DEFAULT_SDK_GATEWAY_LIMITS, ...overrides };
}
