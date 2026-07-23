/**
 * Wall-clock budgets for SDK `account:activate-profile` (ADR-0018 activate timeout sync).
 * OCP auth budget is derived from domain stage timeouts — do not hardcode the sum elsewhere.
 */

import { OCP_SIGN_IN_STAGE_TIMEOUT_MS } from "@domain/index.js";

import type { SdkActivateMode } from "./ExternalSdkAccountPort.js";

/** Operator consent modal TTL (human decision window). */
export const SDK_ACTIVATE_CONSENT_TTL_MS = 120_000;

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

/**
 * Main↔renderer broker timeout for `account:activate-profile` only.
 * consent TTL + max(sip, ocp) auth budget + hop slack.
 */
export const SDK_ACTIVATE_BROKER_TIMEOUT_MS =
  SDK_ACTIVATE_CONSENT_TTL_MS +
  Math.max(
    SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
    SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  ) +
  SDK_ACTIVATE_HOP_SLACK_MS;

/** Same wall budget the SDK client must wait for activate replies. */
export const SDK_ACTIVATE_CLIENT_TIMEOUT_MS = SDK_ACTIVATE_BROKER_TIMEOUT_MS;

export function sdkActivateAuthBudgetMs(mode: SdkActivateMode): number {
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
