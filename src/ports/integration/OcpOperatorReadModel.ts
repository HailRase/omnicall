import type { OperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import type { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";

/**
 * - Purpose: read-only operator snapshot for OCP Use Cases without Zustand imports.
 * - Inputs: projection state updated by gateway message handlers (E-05).
 * - Outputs: current profile and reserved post-call status.
 */
export interface OcpOperatorReadModel {
  getCurrentOperatorProfile(): OperatorProfile | null;
  getReservedStatus(): OperatorStatus | null;
}
