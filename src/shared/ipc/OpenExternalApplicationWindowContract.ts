/**
 * - Purpose: validate IPC payloads for External Application screen-pop windows.
 * - Inputs: unknown renderer payloads.
 * - Outputs: trusted window DTOs or null.
 */
import { isAllowedHttpsUrl } from "@shared/validation/isAllowedHttpsUrl.js";

const MAX_TITLE_LENGTH = 120;
const MIN_WIDTH = 320;
const MAX_WIDTH = 3840;
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 2160;

export type OpenExternalApplicationWindowPayload = Readonly<{
  url: string;
  title: string;
  width: number;
  height: number;
  applicationId: string;
  callId: string;
}>;

export type OpenExternalApplicationWindowResponse =
  | Readonly<{ ok: true; focusedExisting: boolean }>
  | Readonly<{ ok: false; reason: "invalid_payload" | "open_failed" }>;

export function parseOpenExternalApplicationWindowPayload(
  value: unknown,
): OpenExternalApplicationWindowPayload | null {
  if (!isRecord(value)) {
    return null;
  }
  const url = value["url"];
  const title = value["title"];
  const width = value["width"];
  const height = value["height"];
  const applicationId = value["applicationId"];
  const callId = value["callId"];
  if (
    typeof url !== "string" ||
    !isAllowedHttpsUrl(url.trim()) ||
    typeof title !== "string" ||
    title.trim().length === 0 ||
    title.trim().length > MAX_TITLE_LENGTH ||
    !isDimension(width, MIN_WIDTH, MAX_WIDTH) ||
    !isDimension(height, MIN_HEIGHT, MAX_HEIGHT) ||
    !isIdentifier(applicationId) ||
    !isIdentifier(callId)
  ) {
    return null;
  }
  return { url: url.trim(), title: title.trim(), width, height, applicationId, callId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDimension(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256;
}
