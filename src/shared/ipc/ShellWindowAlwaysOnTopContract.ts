/**
 * - Purpose: typed IPC payloads for shell always-on-top pin (F-016).
 * - Inputs: unknown IPC values at preload / main boundaries.
 * - Outputs: validated always-on-top flag payloads or null.
 */

export type ShellWindowAlwaysOnTopPayload = Readonly<{
  alwaysOnTop: boolean;
}>;

export type ShellWindowAlwaysOnTopStateResponse = Readonly<
  | { ok: true; alwaysOnTop: boolean }
  | { ok: false; reason?: string }
>;

export type ShellWindowAlwaysOnTopChangedPayload = Readonly<{
  alwaysOnTop: boolean;
}>;

/**
 * - Purpose: validate set-always-on-top IPC request payloads.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseShellWindowAlwaysOnTopPayload(
  value: unknown,
): ShellWindowAlwaysOnTopPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["alwaysOnTop"] !== "boolean") {
    return null;
  }
  return { alwaysOnTop: candidate["alwaysOnTop"] };
}

/**
 * - Purpose: validate always-on-top state IPC responses.
 * - Inputs: unknown IPC response.
 * - Outputs: typed response or null when invalid.
 */
export function parseShellWindowAlwaysOnTopStateResponse(
  value: unknown,
): ShellWindowAlwaysOnTopStateResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate["ok"] === true && typeof candidate["alwaysOnTop"] === "boolean") {
    return { ok: true, alwaysOnTop: candidate["alwaysOnTop"] };
  }
  if (candidate["ok"] === false) {
    const reason = candidate["reason"];
    if (reason !== undefined && typeof reason !== "string") {
      return null;
    }
    return reason === undefined ? { ok: false } : { ok: false, reason };
  }
  return null;
}

/**
 * - Purpose: validate always-on-top-change IPC payloads at preload boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseShellWindowAlwaysOnTopChangedPayload(
  value: unknown,
): ShellWindowAlwaysOnTopChangedPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["alwaysOnTop"] !== "boolean") {
    return null;
  }
  return { alwaysOnTop: candidate["alwaysOnTop"] };
}
