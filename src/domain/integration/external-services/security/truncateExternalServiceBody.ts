/**
 * - Purpose: bound persisted response text without splitting Unicode code points.
 * - Inputs: arbitrary response text and optional byte limit.
 * - Outputs: UTF-8-safe truncated text with an explicit truncation flag.
 */
export const EXTERNAL_SERVICE_RESPONSE_BODY_MAX_BYTES = 16 * 1024;

export type TruncatedExternalServiceBody = Readonly<{
  body: string;
  truncated: boolean;
}>;

export function truncateExternalServiceBody(
  body: string,
  maxBytes = EXTERNAL_SERVICE_RESPONSE_BODY_MAX_BYTES,
): TruncatedExternalServiceBody {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new Error("External Service body byte limit must be a non-negative integer.");
  }

  let bytes = 0;
  let end = 0;
  for (const character of body) {
    const size = utf8Length(character);
    if (bytes + size > maxBytes) {
      return { body: body.slice(0, end), truncated: true };
    }
    bytes += size;
    end += character.length;
  }
  return { body, truncated: false };
}

function utf8Length(character: string): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) {
    return 0;
  }
  if (codePoint <= 0x7f) {
    return 1;
  }
  if (codePoint <= 0x7ff) {
    return 2;
  }
  if (codePoint <= 0xffff) {
    return 3;
  }
  return 4;
}
