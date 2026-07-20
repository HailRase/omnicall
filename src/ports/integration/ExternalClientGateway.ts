/**
 * Desktop-facing Integration gateway port for the future local SDK WebSocket boundary
 * (F-011 / P12 / DI-01). Interface only — no sockets, IPC, or Electron in this unit.
 *
 * Public wire types come from `@axatalk/protocol`. Domain must never import this port's
 * protocol dependency graph via Domain→ports (Domain does not import ports).
 */

import type {
  DiscoveryDocument,
  ProtocolErrorCode,
  WireMessage,
} from "@axatalk/protocol";

/** Fail-closed inbound validation outcome using stable protocol error codes. */
export type ExternalGatewayValidationSuccess<T> = Readonly<{
  success: true;
  data: T;
}>;

export type ExternalGatewayValidationFailure = Readonly<{
  success: false;
  code: ProtocolErrorCode;
}>;

export type ExternalGatewayValidationResult<T> =
  | ExternalGatewayValidationSuccess<T>
  | ExternalGatewayValidationFailure;

/**
 * Gateway lifecycle observed by diagnostics / settings (product enablement is DI-09).
 * `disabled` is the default product posture until a real adapter is composed.
 */
export type ExternalClientGatewayStatus = "disabled" | "mock" | "listening";

/**
 * Port for the External Client Gateway (ADR-0009/0010).
 * Real loopback transport lands in DI-03; DI-01 provides the contract + mocks.
 */
export interface ExternalClientGateway {
  getStatus(): ExternalClientGatewayStatus;

  /**
   * Validate an inbound WS frame body. Input remains `unknown` until protocol validation
   * succeeds. Must not throw; must not leak Zod internals.
   */
  validateWireInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<WireMessage>;

  /**
   * Validate an inbound discovery document body (HTTP discovery path, DI-03).
   */
  validateDiscoveryInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<DiscoveryDocument>;
}
