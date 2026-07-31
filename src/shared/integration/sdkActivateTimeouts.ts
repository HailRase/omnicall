/**
 * Wall-clock budgets for SDK `account:activate-profile` (ADR-0018 activate timeout sync).
 * Shared SSoT so Electron main (broker) and renderer Application use the same numbers.
 * OCP auth budget is derived from domain stage timeouts — do not hardcode the sum elsewhere.
 *
 * Operator consent TTL is Settings-configurable (default 120s). Broker/SDK hop uses the
 * **max** allowed consent so CRM can wait without its own short timer (no premature cut).
 */

import { OCP_SIGN_IN_STAGE_TIMEOUT_MS } from "@domain/integration/ocp/OcpSignInProgress.js";
import {
  SDK_ACTIVATE_CONSENT_TTL_MS as CONSENT_TTL_DEFAULT_MS,
  SDK_OPERATOR_CONSENT_TTL_MAX_MS,
} from "./sdkOperatorModalTimeouts.js";

export type SdkActivateAuthMode = "ocp" | "sip_only";

/** Default consent TTL. SSoT default: sdkOperatorModalTimeouts. */
export const SDK_ACTIVATE_CONSENT_TTL_MS = CONSENT_TTL_DEFAULT_MS;

/** Upper bound for sip_only REGISTER/authorize after Allow (does not change global SIP UC). */
export const SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS = 60_000;

/** Slack added to the sum of OCP stage timeouts. */
export const SDK_ACTIVATE_OCP_AUTH_SLACK_MS = 5_000;

/** Sum of OCP_SIGN_IN_STAGE_TIMEOUT_MS + slack. */
export const SDK_ACTIVATE_OCP_AUTH_BUDGET_MS =
  (Object.values(OCP_SIGN_IN_STAGE_TIMEOUT_MS) as readonly number[]).reduce(
    (sum, ms) => sum + ms,
    0,
  ) + SDK_ACTIVATE_OCP_AUTH_SLACK_MS;

/** Small hop slack so broker does not cut before handler finishes a terminal reply. */
export const SDK_ACTIVATE_HOP_SLACK_MS = 5_000;

export function sdkActivateHopTimeoutMs(consentTtlMs: number): number {
  return (
    consentTtlMs +
    Math.max(
      SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
      SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
    ) +
    SDK_ACTIVATE_HOP_SLACK_MS
  );
}

/**
 * Main↔renderer broker + SDK correlator ceiling for `account:activate-profile`.
 * Sized for Settings max consent so integrators wait for Desktop terminal reply.
 */
export const SDK_ACTIVATE_BROKER_TIMEOUT_MS = sdkActivateHopTimeoutMs(
  SDK_OPERATOR_CONSENT_TTL_MAX_MS,
);

/** Same wall budget the SDK client must wait for activate replies. */
export const SDK_ACTIVATE_CLIENT_TIMEOUT_MS = SDK_ACTIVATE_BROKER_TIMEOUT_MS;

/** Hop when operator uses the default consent TTL (documentation / tests). */
export const SDK_ACTIVATE_DEFAULT_CONSENT_HOP_MS = sdkActivateHopTimeoutMs(
  SDK_ACTIVATE_CONSENT_TTL_MS,
);

export function sdkActivateAuthBudgetMs(mode: SdkActivateAuthMode): number {
  return mode === "ocp"
    ? SDK_ACTIVATE_OCP_AUTH_BUDGET_MS
    : SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS;
}

export function brokerTimeoutMsForCommand(
  commandType: string,
  defaultTimeoutMs: number,
): number {
  if (commandType === "account:activate-profile") {
    return SDK_ACTIVATE_BROKER_TIMEOUT_MS;
  }
  return defaultTimeoutMs;
}

/**
 * Long broker hops (operator consent / auth) must not hold the per-connection
 * inbound serialization queue — otherwise client `sdk:ping` heartbeats stall,
 * the SDK reconnects, and in-flight activate fails with bare `operation_failed`.
 * Auth-proof ordering (ADR-0016) stays serialized; only these hops detach.
 */
export function releasesSdkInboundQueueWhilePending(
  commandType: string,
): boolean {
  return commandType === "account:activate-profile";
}
