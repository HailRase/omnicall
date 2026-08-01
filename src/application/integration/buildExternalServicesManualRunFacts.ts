/**
 * - Purpose: map product snapshot to manual Run now / Open now trigger facts.
 * - Inputs: External Services product snapshot or null.
 * - Outputs: optional userLogin and focused-call context for Use Case inputs.
 */

import type { ExternalServicesProductSnapshot } from "../services/integration/external-services/ExternalServicesProductSnapshot.js";

export type ExternalServicesManualRunFacts = Readonly<{
  userLogin?: string;
  focusedCallContext?: Readonly<{
    callId: string;
  }>;
}>;

export function buildExternalServicesManualRunFacts(
  snapshot: ExternalServicesProductSnapshot | null,
): ExternalServicesManualRunFacts {
  if (snapshot === null) {
    return {};
  }
  return {
    ...(snapshot.userLogin !== undefined ? { userLogin: snapshot.userLogin } : {}),
    ...(snapshot.focusedCallId !== null
      ? { focusedCallContext: { callId: snapshot.focusedCallId } }
      : {}),
  };
}
