export const OCP_SIGN_IN_EXECUTION_STAGES = [
  "requesting_authorization_token",
  "submitting_token_to_ocp",
  "awaiting_authorization_data",
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

export const OCP_SIGN_IN_STAGE_TIMEOUT_MS: Readonly<
  Record<OcpSignInExecutionStage, number>
> = {
  requesting_authorization_token: 15_000,
  submitting_token_to_ocp: 15_000,
  awaiting_authorization_data: 30_000,
  connecting_sip_transport: 20_000,
  authorizing_sip: 30_000,
};

export function isOcpSignInExecutionStage(
  stage: OcpSignInProgressStage,
): stage is OcpSignInExecutionStage {
  return (OCP_SIGN_IN_EXECUTION_STAGES as ReadonlyArray<string>).includes(stage);
}
