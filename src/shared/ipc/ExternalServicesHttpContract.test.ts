import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  EXTERNAL_SERVICES_HTTP_MAX_REQUEST_BODY_BYTES,
  EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
  parseExternalServicesHttpRequestDto,
  parseExternalServicesHttpResponseDto,
} from "./ExternalServicesHttpContract.js";

describe("ExternalServicesHttpContract", () => {
  it("accepts a valid request and response shape", () => {
    const request = parseExternalServicesHttpRequestDto({
      method: "POST",
      url: "https://example.test/hook",
      headers: [{ key: "X-Test", value: "1" }],
      body: "{\"ok\":true}",
      timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
      correlationId: createCorrelationId(),
    });
    const response = parseExternalServicesHttpResponseDto({
      kind: "response",
      status: 200,
      durationMs: 12,
      body: "ok",
    });

    expect(request).not.toBeNull();
    expect(response).toEqual({
      kind: "response",
      status: 200,
      durationMs: 12,
      body: "ok",
    });
  });

  it("rejects invalid protocol, timeout, and oversized bodies", () => {
    const correlationId = createCorrelationId();
    expect(
      parseExternalServicesHttpRequestDto({
        method: "POST",
        url: "ftp://example.test/hook",
        headers: [],
        body: null,
        timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
        correlationId,
      }),
    ).toBeNull();
    expect(
      parseExternalServicesHttpRequestDto({
        method: "POST",
        url: "https://example.test/hook",
        headers: [],
        body: null,
        timeoutMs: 1,
        correlationId,
      }),
    ).toBeNull();
    expect(
      parseExternalServicesHttpRequestDto({
        method: "POST",
        url: "https://example.test/hook",
        headers: [],
        body: "x".repeat(EXTERNAL_SERVICES_HTTP_MAX_REQUEST_BODY_BYTES + 1),
        timeoutMs: EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
        correlationId,
      }),
    ).toBeNull();
  });
});
