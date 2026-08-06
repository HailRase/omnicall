/**
 * - Purpose: OCP sign-in execution stage vocabulary and per-stage UI/waiter timeouts.
 * - Inputs: stage id from Application orchestration progress updates.
 * - Outputs: ordered stages + timeout ms aligned with real HTTP/WS/SIP waiters.
 */

export const OCP_SIGN_IN_EXECUTION_STAGES = [
  "requesting_authorization_token",
  "submitting_token_to_ocp",
  "awaiting_authorization_data",
  "receiving_phone_credentials",
  "connecting_sip_transport",
  "authorizing_sip",
] as const;

export type OcpSignInExecutionStage = (typeof OCP_SIGN_IN_EXECUTION_STAGES)[number];

export type OcpSignInProgressStage =
  | "idle"
  | OcpSignInExecutionStage
  | "ready"
  | "failed";

export type OcpSignInProgressFailure = Readonly<{
  failedStage: OcpSignInExecutionStage;
  reason: "timeout" | "rejected" | "transport" | "operation_failed";
}>;

export type OcpSignInProgress = Readonly<{
  stage: OcpSignInProgressStage;
  stageStartedAt: string | null;
  failure: OcpSignInProgressFailure | null;
}>;

/**
 * Per-stage wall budgets (UI Progress fill + Application race waiters).
 * Must stay aligned with:
 * - HTTP adapter / race: requesting_authorization_token
 * - OCP_AUTH_SESSION_TIMEOUT_MS: awaiting_authorization_data (+ submit connect wait)
 * - OCP_CREDENTIALS_TIMEOUT_MS: receiving_phone_credentials (starts after OCP authorized)
 * - SIP authorize/register races: connecting_sip_transport / authorizing_sip
 * Sum feeds SDK_ACTIVATE_OCP_AUTH_BUDGET_MS (keep protocol constant in sync).
 */
export const OCP_SIGN_IN_STAGE_TIMEOUT_MS: Readonly<
  Record<OcpSignInExecutionStage, number>
> = {
  requesting_authorization_token: 15_000,
  submitting_token_to_ocp: 15_000,
  awaiting_authorization_data: 15_000,
  receiving_phone_credentials: 15_000,
  connecting_sip_transport: 20_000,
  authorizing_sip: 30_000,
};

export function isOcpSignInExecutionStage(
  stage: OcpSignInProgressStage,
): stage is OcpSignInExecutionStage {
  return (OCP_SIGN_IN_EXECUTION_STAGES as ReadonlyArray<string>).includes(stage);
}
