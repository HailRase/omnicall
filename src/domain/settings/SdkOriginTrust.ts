/**
 * - Purpose: Origin trust states + per-Origin capability matrix (ADR-0018 / DI-11).
 * - Inputs: exact Origin strings and matrix flags from Settings / gateway.
 * - Outputs: typed trust entries; no WebSocket / Electron / protocol imports.
 */

/** Exact Origin trust classification (ADR-0018 §B). */
export type SdkOriginTrustState = "unknown" | "allowed" | "denied";

/**
 * Matrix-governed capability ids (catalog minus unavailable `window.hide`).
 * Privileged `account.activate` is a matrix flag; grants still require consent path.
 */
export const SDK_ORIGIN_MATRIX_CAPABILITY_IDS = [
  "session.read.redacted",
  "window.show",
  "operator.status.write",
  "session.logout",
  "call.originate",
  "call.control",
  "account.activate",
] as const;

export type SdkOriginMatrixCapabilityId =
  (typeof SDK_ORIGIN_MATRIX_CAPABILITY_IDS)[number];

export type SdkOriginCapabilityMatrix = Readonly<{
  capabilities: Readonly<Record<SdkOriginMatrixCapabilityId, boolean>>;
}>;

export type SdkOriginTrustEntry = Readonly<{
  origin: string;
  state: SdkOriginTrustState;
  /**
   * Present when `allowed`, or retained read-only while `denied` after a prior allow.
   * Ignored for authorization while `denied`. Null for first-contact Deny (never allowed).
   */
  matrix: SdkOriginCapabilityMatrix | null;
  /** True once Origin was ever `allowed` (Unblock restore rule). */
  previouslyAllowed: boolean;
}>;

/** Non-privileged call_controller defaults; `account.activate` off (ADR-0018 §D). */
export function createDefaultSdkOriginCapabilityMatrix(): SdkOriginCapabilityMatrix {
  return {
    capabilities: {
      "session.read.redacted": true,
      "window.show": true,
      "operator.status.write": true,
      "session.logout": true,
      "call.originate": true,
      "call.control": true,
      "account.activate": false,
    },
  };
}

export function listEnabledMatrixCapabilities(
  matrix: SdkOriginCapabilityMatrix,
): readonly SdkOriginMatrixCapabilityId[] {
  return SDK_ORIGIN_MATRIX_CAPABILITY_IDS.filter(
    (id) => matrix.capabilities[id] === true,
  );
}

export function isMatrixCapabilityEnabled(
  matrix: SdkOriginCapabilityMatrix,
  capability: SdkOriginMatrixCapabilityId,
): boolean {
  return matrix.capabilities[capability] === true;
}

export function withMatrixCapability(
  matrix: SdkOriginCapabilityMatrix,
  capability: SdkOriginMatrixCapabilityId,
  enabled: boolean,
): SdkOriginCapabilityMatrix {
  return {
    capabilities: {
      ...matrix.capabilities,
      [capability]: enabled,
    },
  };
}
