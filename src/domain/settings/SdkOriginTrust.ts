/**
 * - Purpose: Origin trust states + per-Origin capability matrix (ADR-0018 / DI-11 / ADR-0021).
 * - Inputs: exact Origin strings and matrix flags from Settings / gateway.
 * - Outputs: typed trust entries; no WebSocket / Electron / protocol imports.
 */

/** Exact Origin trust classification (ADR-0018 §B). */
export type SdkOriginTrustState = "unknown" | "allowed" | "denied";

/**
 * Matrix-governed capability ids (catalog including privileged matrix toggles).
 * Privileged `account.activate` / `window.hide` are matrix flags; grants still
 * require elevation path (never pairing defaults).
 * Granular call caps (ADR-0021) are additive; `call.control` remains umbrella + DTMF.
 */
export const SDK_ORIGIN_MATRIX_CAPABILITY_IDS = [
  "session.read.redacted",
  "window.show",
  "window.hide",
  "operator.status.write",
  "operator.campaign.read",
  "ocp.acd_context.read",
  "session.logout",
  "call.originate",
  "call.control",
  "call.answer",
  "call.reject",
  "call.hangup",
  "call.hold",
  "call.mute",
  "account.activate",
] as const;

export type SdkOriginMatrixCapabilityId =
  (typeof SDK_ORIGIN_MATRIX_CAPABILITY_IDS)[number];

/** Granular call matrix ids covered by umbrella `call.control`. */
export const SDK_ORIGIN_CALL_GRANULAR_IDS = [
  "call.answer",
  "call.reject",
  "call.hangup",
  "call.hold",
  "call.mute",
] as const satisfies readonly SdkOriginMatrixCapabilityId[];

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

/** Non-privileged call_controller defaults; privileged caps off (ADR-0018 §D). */
export function createDefaultSdkOriginCapabilityMatrix(): SdkOriginCapabilityMatrix {
  return {
    capabilities: {
      "session.read.redacted": true,
      "window.show": true,
      "window.hide": false,
      "operator.status.write": true,
      "operator.campaign.read": true,
      "ocp.acd_context.read": true,
      "session.logout": true,
      "call.originate": true,
      "call.control": true,
      "call.answer": true,
      "call.reject": true,
      "call.hangup": true,
      "call.hold": true,
      "call.mute": true,
      "account.activate": false,
    },
  };
}

/**
 * Additive defaults for matrix keys introduced after an Origin was persisted.
 * Missing keys must not wipe the whole trust store (ADR-0019 / ADR-0020 / ADR-0021).
 * Granular call caps are filled from persisted `call.control` in parseMatrix (not here).
 */
export const SDK_ORIGIN_MATRIX_ADDITIVE_DEFAULTS: Readonly<
  Partial<Record<SdkOriginMatrixCapabilityId, boolean>>
> = {
  "operator.campaign.read": true,
  "ocp.acd_context.read": true,
  "window.hide": false,
};

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

/**
 * Recompute umbrella from granular rows (ADR-0021).
 * Never silent-enables a granular flag; may only clear `call.control` when any
 * granular row is false (fail-closed vs hand-edited `control:true` + granular false).
 */
export function normalizeSdkOriginCallMatrix(
  matrix: SdkOriginCapabilityMatrix,
): SdkOriginCapabilityMatrix {
  const capabilities: Record<SdkOriginMatrixCapabilityId, boolean> = {
    ...matrix.capabilities,
    "call.control": SDK_ORIGIN_CALL_GRANULAR_IDS.every(
      (id) => matrix.capabilities[id] === true,
    ),
  };
  return { capabilities };
}

/**
 * Keep umbrella `call.control` aligned with granular flags (ADR-0021).
 * - Toggling umbrella on/off mirrors all granular rows.
 * - Toggling a granular row sets umbrella = AND(granular).
 */
export function withMatrixCapability(
  matrix: SdkOriginCapabilityMatrix,
  capability: SdkOriginMatrixCapabilityId,
  enabled: boolean,
): SdkOriginCapabilityMatrix {
  const next: Record<SdkOriginMatrixCapabilityId, boolean> = {
    ...matrix.capabilities,
    [capability]: enabled,
  };
  if (capability === "call.control") {
    for (const id of SDK_ORIGIN_CALL_GRANULAR_IDS) {
      next[id] = enabled;
    }
  } else if (
    (SDK_ORIGIN_CALL_GRANULAR_IDS as readonly string[]).includes(capability)
  ) {
    next["call.control"] = SDK_ORIGIN_CALL_GRANULAR_IDS.every(
      (id) => next[id] === true,
    );
  }
  return { capabilities: next };
}
