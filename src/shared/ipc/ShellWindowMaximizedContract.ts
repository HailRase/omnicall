/**
 * - Purpose: typed IPC payload for shell window maximized state changes (F-016).
 * - Inputs: unknown IPC values from main → renderer.
 * - Outputs: validated maximized flag or null.
 */

export type ShellWindowMaximizedChangedPayload = Readonly<{
  maximized: boolean;
}>;

/**
 * - Purpose: validate maximized-change IPC payloads at preload boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseShellWindowMaximizedChangedPayload(
  value: unknown,
): ShellWindowMaximizedChangedPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate["maximized"] !== "boolean") {
    return null;
  }

  return { maximized: candidate["maximized"] };
}
