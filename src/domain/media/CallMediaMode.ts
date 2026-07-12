/**
 * - Purpose: per-call media mode for audio vs video negotiation intent.
 * - Inputs: mode string at Domain/Application boundaries.
 * - Outputs: typed CallMediaMode or parse failure.
 */

export const CALL_MEDIA_MODES = ["audio", "video"] as const;

export type CallMediaMode = (typeof CALL_MEDIA_MODES)[number];

export const DEFAULT_CALL_MEDIA_MODE: CallMediaMode = "audio";

export function isCallMediaMode(value: unknown): value is CallMediaMode {
  return (
    typeof value === "string" &&
    (CALL_MEDIA_MODES as ReadonlyArray<string>).includes(value)
  );
}

export function parseCallMediaMode(value: unknown): CallMediaMode | null {
  return isCallMediaMode(value) ? value : null;
}
