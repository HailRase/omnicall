/**
 * - Purpose: validate External Services outbound HTTP IPC payloads and responses.
 * - Inputs: unknown preload/main IPC values for one request attempt.
 * - Outputs: typed request/response DTOs or null when invalid.
 */

import { isCorrelationId, type CorrelationId } from "@shared/correlation-id/index.js";

export const EXTERNAL_SERVICES_HTTP_TIMEOUT_MS = 10_000 as const;
export const EXTERNAL_SERVICES_HTTP_MAX_URL_CHARS = 8_192;
export const EXTERNAL_SERVICES_HTTP_MAX_HEADER_CHARS = 8_192;
export const EXTERNAL_SERVICES_HTTP_MAX_HEADERS = 64;
export const EXTERNAL_SERVICES_HTTP_MAX_REQUEST_BODY_BYTES = 256 * 1024;
export const EXTERNAL_SERVICES_HTTP_MAX_RESPONSE_BODY_BYTES = 1 * 1024 * 1024;
export const EXTERNAL_SERVICES_HTTP_MAX_REDIRECTS = 5;

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const NETWORK_ERROR_CODES = [
  "aborted",
  "connection_refused",
  "connection_reset",
  "dns",
  "network",
  "timeout",
  "tls",
  "unknown",
] as const;

export type ExternalServicesHttpMethodDto = (typeof HTTP_METHODS)[number];
export type ExternalServicesHttpNetworkErrorCode =
  (typeof NETWORK_ERROR_CODES)[number];

export type ExternalServicesHttpHeaderDto = Readonly<{
  key: string;
  value: string;
}>;

export type ExternalServicesHttpRequestDto = Readonly<{
  method: ExternalServicesHttpMethodDto;
  url: string;
  headers: ReadonlyArray<ExternalServicesHttpHeaderDto>;
  body: string | null;
  timeoutMs: typeof EXTERNAL_SERVICES_HTTP_TIMEOUT_MS;
  correlationId: CorrelationId;
}>;

export type ExternalServicesHttpResponseDto =
  | Readonly<{
      kind: "response";
      status: number;
      durationMs: number;
      body: string;
    }>
  | Readonly<{
      kind: "network_error";
      code: ExternalServicesHttpNetworkErrorCode;
      durationMs: number;
      message: string;
    }>;

export function parseExternalServicesHttpRequestDto(
  value: unknown,
): ExternalServicesHttpRequestDto | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (!isHttpMethod(candidate["method"])) {
    return null;
  }
  if (typeof candidate["url"] !== "string") {
    return null;
  }
  const url = candidate["url"].trim();
  if (!isAllowedHttpUrl(url) || url.length > EXTERNAL_SERVICES_HTTP_MAX_URL_CHARS) {
    return null;
  }
  if (candidate["timeoutMs"] !== EXTERNAL_SERVICES_HTTP_TIMEOUT_MS) {
    return null;
  }
  if (
    typeof candidate["correlationId"] !== "string" ||
    !isCorrelationId(candidate["correlationId"])
  ) {
    return null;
  }
  const headers = parseHeaders(candidate["headers"]);
  if (headers === null) {
    return null;
  }
  const body = parseBody(candidate["body"]);
  if (body === undefined) {
    return null;
  }
  return {
    method: candidate["method"],
    url,
    headers,
    body,
    timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
    correlationId: candidate["correlationId"],
  };
}

export function parseExternalServicesHttpResponseDto(
  value: unknown,
): ExternalServicesHttpResponseDto | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate["kind"] === "response") {
    return parseResponseSuccess(candidate);
  }
  if (candidate["kind"] === "network_error") {
    return parseResponseNetworkError(candidate);
  }
  return null;
}

function parseResponseSuccess(
  candidate: Record<string, unknown>,
): ExternalServicesHttpResponseDto | null {
  if (
    typeof candidate["status"] !== "number" ||
    !Number.isInteger(candidate["status"]) ||
    candidate["status"] < 100 ||
    candidate["status"] > 599 ||
    typeof candidate["durationMs"] !== "number" ||
    !Number.isFinite(candidate["durationMs"]) ||
    candidate["durationMs"] < 0 ||
    typeof candidate["body"] !== "string"
  ) {
    return null;
  }
  return {
    kind: "response",
    status: candidate["status"],
    durationMs: candidate["durationMs"],
    body: candidate["body"],
  };
}

function parseResponseNetworkError(
  candidate: Record<string, unknown>,
): ExternalServicesHttpResponseDto | null {
  if (
    typeof candidate["code"] !== "string" ||
    !isNetworkErrorCode(candidate["code"]) ||
    typeof candidate["durationMs"] !== "number" ||
    !Number.isFinite(candidate["durationMs"]) ||
    candidate["durationMs"] < 0 ||
    typeof candidate["message"] !== "string"
  ) {
    return null;
  }
  return {
    kind: "network_error",
    code: candidate["code"],
    durationMs: candidate["durationMs"],
    message: candidate["message"],
  };
}

function isNetworkErrorCode(
  value: string,
): value is ExternalServicesHttpNetworkErrorCode {
  return (NETWORK_ERROR_CODES as readonly string[]).includes(value);
}

function parseHeaders(
  value: unknown,
): ReadonlyArray<ExternalServicesHttpHeaderDto> | null {
  if (!Array.isArray(value) || value.length > EXTERNAL_SERVICES_HTTP_MAX_HEADERS) {
    return null;
  }
  const headers: ExternalServicesHttpHeaderDto[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }
    const row = item as Record<string, unknown>;
    if (typeof row["key"] !== "string" || typeof row["value"] !== "string") {
      return null;
    }
    if (
      row["key"].length > EXTERNAL_SERVICES_HTTP_MAX_HEADER_CHARS ||
      row["value"].length > EXTERNAL_SERVICES_HTTP_MAX_HEADER_CHARS
    ) {
      return null;
    }
    headers.push({ key: row["key"], value: row["value"] });
  }
  return headers;
}

function parseBody(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  if (utf8ByteLength(value) > EXTERNAL_SERVICES_HTTP_MAX_REQUEST_BODY_BYTES) {
    return undefined;
  }
  return value;
}

function isHttpMethod(value: unknown): value is ExternalServicesHttpMethodDto {
  return (
    typeof value === "string" &&
    (HTTP_METHODS as readonly string[]).includes(value)
  );
}

function isAllowedHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
