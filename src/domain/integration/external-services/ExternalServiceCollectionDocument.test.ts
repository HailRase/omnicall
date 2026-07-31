/**
 * - Purpose: verify single-collection document round-trip and fail-closed import rules.
 * - Inputs: fixture collections and malformed payloads.
 * - Outputs: pass/fail coverage for parse, regenerate, and copy naming.
 */

import { describe, expect, it } from "vitest";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import {
  buildExternalServiceCollectionDocument,
  buildExternalServiceCollectionSuggestedFileName,
  EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES,
  EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
  EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION,
  parseExternalServiceCollectionDocument,
  parseExternalServiceCollectionJson,
  parseExternalServicesSettings,
  regenerateExternalServiceCollectionIds,
  resolveImportedExternalServiceCollectionName,
  serializeExternalServiceCollectionDocument,
} from "./index.js";

function createFixtureCollection() {
  const parsed = parseExternalServicesSettings({
    collections: [
      {
        id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "CRM",
        enabled: true,
        variables: [{ key: "base_url", value: "https://crm.example.test" }],
        requests: [
          {
            id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
            name: "Notify",
            enabled: true,
            method: "POST",
            url: "{{base_url}}/events",
            query: [],
            headers: [
              {
                id: "c0b1c2d3-e4f5-4a67-8b90-123456789012",
                key: "Authorization",
                value: "Bearer secret-token",
                enabled: true,
              },
            ],
            body: { mode: "json", value: "{\"event\":\"{{event_type}}\"}" },
            triggers: [{ eventType: "call_answered", delaySeconds: 0 }],
          },
        ],
      },
    ],
  });
  if (!parsed.ok || parsed.value.collections[0] === undefined) {
    throw new Error("Failed to build collection fixture.");
  }
  return parsed.value.collections[0];
}

describe("ExternalServiceCollectionDocument", () => {
  const collection = createFixtureCollection();

  it("round-trips a valid collection while preserving IDs on export", () => {
    const document = buildExternalServiceCollectionDocument({
      collection,
      exportedAt: "2026-07-29T12:00:00.000Z",
    });
    const json = serializeExternalServiceCollectionDocument(document);
    const parsed = parseExternalServiceCollectionJson(json);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.format).toBe(EXTERNAL_SERVICE_COLLECTION_FORMAT_ID);
    expect(parsed.value.formatVersion).toBe(EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION);
    expect(parsed.value.collection).toEqual(collection);
    expect(json.endsWith("\n")).toBe(true);
  });

  it("regenerates collection, request, and row IDs", () => {
    const regenerated = regenerateExternalServiceCollectionIds(
      collection,
      new DeterministicUuidGenerator(),
    );

    expect(regenerated.id).not.toBe(collection.id);
    expect(regenerated.requests[0]?.id).not.toBe(collection.requests[0]?.id);
    expect(regenerated.requests[0]?.headers[0]?.id).not.toBe(
      collection.requests[0]?.headers[0]?.id,
    );
    expect(regenerated.name).toBe(collection.name);
    expect(regenerated.requests[0]?.url).toBe(collection.requests[0]?.url);
  });

  it("resolves deterministic copy suffixes for name collisions", () => {
    const existing = new Set(["CRM", "CRM (copy)", "CRM (copy 2)"]);
    expect(resolveImportedExternalServiceCollectionName("CRM", existing)).toBe(
      "CRM (copy 3)",
    );
    expect(resolveImportedExternalServiceCollectionName("Alerts", existing)).toBe(
      "Alerts",
    );
    expect(
      resolveImportedExternalServiceCollectionName(
        "CRM",
        new Set(["CRM"]),
      ),
    ).toBe("CRM (copy)");
  });

  it("rejects unknown format and version without accepting Postman documents", () => {
    expect(
      parseExternalServiceCollectionDocument({
        info: { schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
        item: [],
      }).ok,
    ).toBe(false);

    expect(
      parseExternalServiceCollectionDocument({
        format: EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
        formatVersion: 99,
        exportedAt: "2026-07-29T12:00:00.000Z",
        collection,
      }).ok,
    ).toBe(false);
  });

  it("rejects malformed JSON and oversized payloads", () => {
    expect(parseExternalServiceCollectionJson("{").ok).toBe(false);

    const oversized = "x".repeat(EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES + 1);
    const oversizedResult = parseExternalServiceCollectionJson(oversized);
    expect(oversizedResult.ok).toBe(false);
    if (!oversizedResult.ok) {
      expect(oversizedResult.error.code).toBe("file_too_large");
    }
  });

  it("builds a safe suggested filename", () => {
    expect(buildExternalServiceCollectionSuggestedFileName("CRM Hook!")).toBe(
      "omnicall-external-service-crm-hook.json",
    );
    expect(buildExternalServiceCollectionSuggestedFileName("   ")).toBe(
      "omnicall-external-service-collection.json",
    );
  });
});
