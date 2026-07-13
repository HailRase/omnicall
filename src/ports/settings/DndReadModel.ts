/**
 * - Purpose: read-only DND flag for cross-context guards (OCP status change, telephony).
 * - Inputs: phone status projection or settings read model (E-05 bridge).
 * - Outputs: whether Do Not Disturb mode is active.
 */
export interface DndReadModel {
  isDndEnabled(): boolean;
}
