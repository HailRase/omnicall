/**
 * In-memory Origin trust mutations for LocalWsServerAdapter (DI-11).
 */

import {
  allowSdkOrigin,
  denySdkOrigin,
  type SdkOriginTrustEntry,
} from "@domain/index.js";

import type { SdkOriginTrustDecision } from "./sdkGatewayOriginTrustApprover.js";

export function applySdkOriginTrustDecision(
  entries: readonly SdkOriginTrustEntry[],
  input: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
): readonly SdkOriginTrustEntry[] {
  const settings = { originsManaged: true as const, origins: [...entries] };
  const next =
    input.decision.decision === "allow"
      ? allowSdkOrigin(settings, input.origin)
      : denySdkOrigin(settings, input.origin);
  return next?.origins ?? entries;
}
