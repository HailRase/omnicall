export type ShellWindowControlResponse = Readonly<{
  ok: boolean;
  reason?: string;
}>;

/**
 * - Purpose: validate shell window control IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed response or null when invalid.
 */
export function parseShellWindowControlResponse(value: unknown): ShellWindowControlResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const ok = candidate["ok"];
  if (typeof ok !== "boolean") {
    return null;
  }

  const reason = candidate["reason"];
  if (reason !== undefined && typeof reason !== "string") {
    return null;
  }

  return reason === undefined ? { ok } : { ok, reason };
}
