/**
 * Re-export shared activate timeout SSoT for Application consumers.
 * Implementation lives in `@shared/integration/sdkActivateTimeouts` (main-safe).
 */

export {
  SDK_ACTIVATE_BROKER_TIMEOUT_MS,
  SDK_ACTIVATE_CLIENT_TIMEOUT_MS,
  SDK_ACTIVATE_CONSENT_TTL_MS,
  SDK_ACTIVATE_HOP_SLACK_MS,
  SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  SDK_ACTIVATE_OCP_AUTH_SLACK_MS,
  SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
  brokerTimeoutMsForCommand,
  releasesSdkInboundQueueWhilePending,
  sdkActivateAuthBudgetMs,
  type SdkActivateAuthMode,
} from "@shared/integration/sdkActivateTimeouts.js";
