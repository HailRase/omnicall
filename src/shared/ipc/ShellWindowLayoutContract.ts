import type { ShellWindowLayoutMode } from "@domain/platform/ShellWindowLayout.js";

export type ShellWindowLayoutPayload = Readonly<{
  mode: ShellWindowLayoutMode;
  animationDurationMs: number;
  reducedMotion: boolean;
}>;

const SHELL_WINDOW_LAYOUT_MODES: ReadonlyArray<ShellWindowLayoutMode> = [
  "compact",
  "settings",
  "video-fullscreen",
];

/**
 * - Purpose: validate shell window layout IPC payloads at preload boundary (F-016).
 * - Inputs: unknown IPC payload.
 * - Outputs: typed layout payload or null when invalid.
 */
export function parseShellWindowLayoutPayload(
  value: unknown,
): ShellWindowLayoutPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const mode = candidate["mode"];
  const animationDurationMs = candidate["animationDurationMs"];
  const reducedMotion = candidate["reducedMotion"];

  if (typeof mode !== "string" || !SHELL_WINDOW_LAYOUT_MODES.includes(mode as ShellWindowLayoutMode)) {
    return null;
  }

  if (typeof animationDurationMs !== "number" || !Number.isFinite(animationDurationMs) || animationDurationMs < 0) {
    return null;
  }

  if (typeof reducedMotion !== "boolean") {
    return null;
  }

  return {
    mode: mode as ShellWindowLayoutMode,
    animationDurationMs,
    reducedMotion,
  };
}
