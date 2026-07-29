/**
 * - Purpose: perform bounded main-process HTTP for External Services (F-031).
 * - Inputs: validated request DTO and abort signal for timeout/shutdown.
 * - Outputs: transport response or normalized network error facts.
 */

import {
  EXTERNAL_SERVICES_HTTP_MAX_REDIRECTS,
  EXTERNAL_SERVICES_HTTP_MAX_RESPONSE_BODY_BYTES,
  type ExternalServicesHttpRequestDto,
  type ExternalServicesHttpResponseDto,
} from "@shared/ipc/ExternalServicesHttpContract.js";

const PROTECTED_HEADER_NAMES = new Set(["authorization", "cookie", "x-api-key"]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function executeExternalServicesHttpRequest(
  request: ExternalServicesHttpRequestDto,
  signal: AbortSignal,
): Promise<ExternalServicesHttpResponseDto> {
  const startedAt = Date.now();
  try {
    return await dispatchWithRedirects(request, signal, startedAt);
  } catch (error: unknown) {
    return {
      kind: "network_error",
      code: classifyNetworkError(error, signal),
      durationMs: elapsed(startedAt),
      message: normalizeErrorMessage(error),
    };
  }
}

async function dispatchWithRedirects(
  request: ExternalServicesHttpRequestDto,
  signal: AbortSignal,
  startedAt: number,
): Promise<ExternalServicesHttpResponseDto> {
  let url = request.url;
  let method = request.method;
  let body = request.body;
  let headers = toHeaderMap(request.headers);
  let redirects = 0;

  while (true) {
    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
      signal,
    };
    if (body !== null && method !== "GET" && method !== "DELETE") {
      init.body = body;
    }
    const response = await fetch(url, init);

    if (REDIRECT_STATUSES.has(response.status) && redirects < EXTERNAL_SERVICES_HTTP_MAX_REDIRECTS) {
      const nextUrl = resolveRedirectUrl(url, response.headers.get("location"));
      await response.arrayBuffer().catch(() => undefined);
      if (nextUrl === null) {
        return {
          kind: "network_error",
          code: "network",
          durationMs: elapsed(startedAt),
          message: "Invalid redirect location.",
        };
      }
      if (originOf(url) !== originOf(nextUrl)) {
        headers = stripProtectedHeaders(headers);
      }
      if (response.status === 303) {
        method = "GET";
        body = null;
      }
      url = nextUrl;
      redirects += 1;
      continue;
    }

    const bodyResult = await readBoundedBody(response);
    return {
      kind: "response",
      status: response.status,
      durationMs: elapsed(startedAt),
      body: bodyResult,
    };
  }
}

async function readBoundedBody(response: Response): Promise<string> {
  const buffer = new Uint8Array(
    await response.arrayBuffer().catch(() => new ArrayBuffer(0)),
  );
  const limited =
    buffer.byteLength > EXTERNAL_SERVICES_HTTP_MAX_RESPONSE_BODY_BYTES
      ? buffer.slice(0, EXTERNAL_SERVICES_HTTP_MAX_RESPONSE_BODY_BYTES)
      : buffer;
  return new TextDecoder("utf-8", { fatal: false }).decode(limited);
}

function toHeaderMap(
  headers: ExternalServicesHttpRequestDto["headers"],
): Headers {
  const result = new Headers();
  for (const header of headers) {
    if (header.key.trim().length === 0) {
      continue;
    }
    result.append(header.key, header.value);
  }
  return result;
}

function stripProtectedHeaders(headers: Headers): Headers {
  const next = new Headers();
  headers.forEach((value, key) => {
    if (!PROTECTED_HEADER_NAMES.has(key.trim().toLowerCase())) {
      next.append(key, value);
    }
  });
  return next;
}

function resolveRedirectUrl(currentUrl: string, location: string | null): string | null {
  if (location === null || location.trim().length === 0) {
    return null;
  }
  try {
    const resolved = new URL(location, currentUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function elapsed(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function classifyNetworkError(
  error: unknown,
  signal: AbortSignal,
): Extract<ExternalServicesHttpResponseDto, { kind: "network_error" }>["code"] {
  if (signal.aborted || isAbortError(error)) {
    return signal.reason === "timeout" ? "timeout" : "aborted";
  }
  const message = normalizeErrorMessage(error).toLowerCase();
  if (message.includes("enotfound") || message.includes("getaddrinfo")) {
    return "dns";
  }
  if (message.includes("econnrefused")) {
    return "connection_refused";
  }
  if (message.includes("econnreset")) {
    return "connection_reset";
  }
  if (message.includes("certificate") || message.includes("ssl") || message.includes("tls")) {
    return "tls";
  }
  return "network";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 200);
  }
  return "Outbound HTTP request failed.";
}
