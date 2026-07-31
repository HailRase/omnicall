import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@domain/settings/SettingsAccountKey.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type {
  ExternalServiceCollection,
  ExternalServiceKeyValue,
  ExternalServiceRequest,
} from "./index.js";
import {
  buildExternalServiceHttpRequest,
  buildExternalServiceVariables,
  matchExternalServiceRequests,
  redactExternalServiceHeaders,
  resolveExternalServiceTemplate,
  truncateExternalServiceBody,
} from "./index.js";

const collectionId = "11111111-1111-4111-8111-111111111111" as ExternalServiceCollection["id"];
const requestId = "22222222-2222-4222-8222-222222222222" as ExternalServiceRequest["id"];
const rowId = "33333333-3333-4333-8333-333333333333" as ExternalServiceKeyValue["id"];
const correlationId = "test-correlation" as CorrelationId;
const profileKey = createSettingsAccountKey("agent@example.test");

function createRequest(
  overrides: Partial<ExternalServiceRequest> = {},
): ExternalServiceRequest {
  return {
    id: requestId,
    name: "Notify",
    enabled: true,
    method: "POST",
    url: "https://example.test/hook?source=authored",
    query: [],
    headers: [],
    body: { mode: "none", value: "" },
    triggers: [{ eventType: "call_answered", delaySeconds: 0 }],
    ...overrides,
  };
}

describe("External Services domain policies", () => {
  it("resolves all non-recursive placeholders and missing values", () => {
    expect(
      resolveExternalServiceTemplate(
        "{{a}}{{a}}/{{missing}}/{{Case}}",
        { a: "{{b}}", b: "expanded", Case: "value" },
      ),
    ).toBe("{{b}}{{b}}/undefined/value");
  });

  it("applies system variables after authored collection variables", () => {
    const variables = buildExternalServiceVariables(
      [
        { key: "event_type", value: "spoofed" },
        { key: "custom", value: "kept" },
      ],
      {
        eventType: "call_answered",
        occurredAt: "2026-07-29T19:00:00.000Z",
        profileKey,
        callId: "call-1",
      },
    );
    expect(variables).toMatchObject({
      event_type: "call_answered",
      call_id: "call-1",
      custom: "kept",
    });
  });

  it("matches only enabled definitions and applies the focus gate", () => {
    const collection: ExternalServiceCollection = {
      id: collectionId,
      name: "Primary",
      enabled: true,
      variables: [],
      requests: [
        createRequest(),
        createRequest({ id: requestId, enabled: false }),
      ],
    };
    const trigger = {
      eventType: "call_answered" as const,
      occurredAt: "2026-07-29T19:00:00.000Z",
      profileKey,
    };
    expect(matchExternalServiceRequests({ collections: [collection] }, trigger, false)).toEqual([]);
    expect(matchExternalServiceRequests({ collections: [collection] }, trigger, true)).toHaveLength(1);
  });

  it("builds one-encoded query, preserves duplicate headers, and warns for invalid JSON", () => {
    const request = createRequest({
      url: "https://example.test/{{path}}",
      query: [
        { id: rowId, key: "tag", value: "{{value}}", enabled: true },
        { id: rowId, key: "tag", value: "{{value}}", enabled: true },
      ],
      headers: [
        { id: rowId, key: "X-Token", value: "{{value}}", enabled: true },
        { id: rowId, key: "X-Token", value: "{{value}}", enabled: true },
      ],
      body: { mode: "json", value: "{\"id\": {{missing}}" },
    });
    const result = buildExternalServiceHttpRequest(
      request,
      { path: "items", value: "a b" },
      correlationId,
    );
    expect(result).toMatchObject({
      kind: "success",
      jsonValidity: "invalid",
      request: {
        url: "https://example.test/items?tag=a+b&tag=a+b",
        body: "{\"id\": undefined",
      },
    });
    if (result.kind === "success") {
      expect(result.request.headers.filter((header) => header.key === "X-Token")).toHaveLength(2);
      expect(result.request.headers.some((header) => header.key === "Content-Type")).toBe(true);
    }
  });

  it("rejects unsupported URLs and protects journal values and Unicode boundaries", () => {
    expect(
      buildExternalServiceHttpRequest(
        createRequest({ url: "file:///secret" }),
        {},
        correlationId,
      ),
    ).toEqual({ kind: "validation_error", code: "unsupported_url_protocol" });
    expect(
      redactExternalServiceHeaders([
        { id: rowId, key: "Authorization", value: "secret", enabled: true },
      ]),
    ).toMatchObject([{ value: "***" }]);
    expect(truncateExternalServiceBody("a😀b", 4)).toEqual({
      body: "a",
      truncated: true,
    });
  });
});
