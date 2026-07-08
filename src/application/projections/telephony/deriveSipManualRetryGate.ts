import type { SipSessionHealth } from "@domain/index.js";

/**
 * - Purpose: detect active SIP auto-recovery for manual retry guards (F-014).
 * - Inputs: sip session health snapshot.
 * - Outputs: true when countdown or in-flight recovery is active.
 */
export function isSipRecoveryInProgress(health: SipSessionHealth): boolean {
  if (health.recovery.nextRetryAt !== null) {
    return true;
  }
  if (health.transport === "reconnecting") {
    return true;
  }
  if (health.registration === "registering") {
    return true;
  }
  return false;
}

/**
 * - Purpose: detect terminal SIP failure eligible for manual transport reconnect.
 * - Inputs: sip session health snapshot.
 * - Outputs: true when recovery exhausted and session is active.
 */
export function isSipManualRetryAvailable(health: SipSessionHealth): boolean {
  if (health.lifecycle !== "active") {
    return false;
  }
  if (isSipRecoveryInProgress(health)) {
    return false;
  }
  if (health.recovery.target === null) {
    return false;
  }
  return health.recovery.nextRetryAt === null;
}
