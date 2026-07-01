import { isAllowedHttpsUrl } from "@shared/validation/isAllowedHttpsUrl.js";

export type OpenExternalUrlPayload = Readonly<{
  url: string;
}>;

export type OpenExternalUrlResponse = Readonly<{
  ok: boolean;
  reason?: string;
}>;

/**
 * - Purpose: validate open-external-url IPC payloads at preload boundary (F-020).
 * - Inputs: unknown IPC payload.
 * - Outputs: typed HTTPS URL payload or null when invalid.
 */
export function parseOpenExternalUrlPayload(value: unknown): OpenExternalUrlPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const url = candidate["url"];
  if (typeof url !== "string" || url.trim().length === 0) {
    return null;
  }

  const trimmed = url.trim();
  if (!isAllowedHttpsUrl(trimmed)) {
    return null;
  }

  return { url: trimmed };
}
