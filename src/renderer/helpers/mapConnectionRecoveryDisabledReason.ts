import type { ConnectionRecoveryReasonKey } from "@application/projections/deriveConnectionRecoveryShell.js";
import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: resolve connection recovery disabled-reason keys for renderer UI.
 * - Inputs: semantic reason key from connection recovery projection.
 * - Outputs: localized disabled-reason label or null.
 */
export function mapConnectionRecoveryDisabledReason(
  reasonKey: ConnectionRecoveryReasonKey | null,
): string | null {
  if (reasonKey === null) {
    return null;
  }
  return translateCurrent(reasonKey);
}
