/**
 * - Purpose: derive edit-only OCP Module shell flags (no sign-in / status ownership).
 * - Inputs: account-session gate flag (ADR-AF-005).
 * - Outputs: config editability; recovery CTA removed (status lives in System State).
 */

export type OcpModuleEditShellInput = Readonly<{
  /** Account session active; OCP Module is only reachable when Settings gate is open. */
  hasActiveAccountSession: boolean;
}>;

export type OcpModuleEditShell = Readonly<{
  /** Configuration fields may be edited for the active authenticated profile. */
  configEditable: boolean;
  /**
   * Status/recovery ownership moved to System State OCP tab (ADR-AF-005).
   * Always false — Integrations must not offer Account recovery CTA.
   */
  openAccountForRecoveryVisible: boolean;
}>;

export function deriveOcpModuleEditShell(
  input: OcpModuleEditShellInput,
): OcpModuleEditShell {
  return {
    configEditable: input.hasActiveAccountSession,
    openAccountForRecoveryVisible: false,
  };
}
