import { describe, expect, it } from "vitest";
import { parseExternalServicesSettings } from "./parseExternalServicesSettings.js";

const COLLECTION_ID = "a0b1c2d3-e4f5-4a67-8b90-123456789012";
const REQUEST_ID = "b0b1c2d3-e4f5-4a67-8b90-123456789012";
const ROW_ID = "c0b1c2d3-e4f5-4a67-8b90-123456789012";

function createValidSettings(): unknown {
  return {
    collections: [
      {
        id: COLLECTION_ID,
        name: " CRM ",
        enabled: true,
        variables: [{ key: "base_url", value: "https://crm.example.test" }],
        requests: [
          {
            id: REQUEST_ID,
            name: " Notify ",
            enabled: true,
            method: "POST",
            url: "{{base_url}}/events",
            query: [{ id: ROW_ID, key: "source", value: "softphone", enabled: true }],
            headers: [],
            body: { mode: "json", value: "{\"event\":\"{{event_type}}\"}" },
            triggers: [{ eventType: "call_answered", delaySeconds: 0 }],
          },
        ],
      },
    ],
  };
}

describe("parseExternalServicesSettings", () => {
  it("parses and freezes a valid immutable settings aggregate", () => {
    const result = parseExternalServicesSettings(createValidSettings());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.collections[0]?.name).toBe("CRM");
      expect(result.value.collections[0]?.requests[0]?.name).toBe("Notify");
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.isFrozen(result.value.collections)).toBe(true);
    }
  });

  it("rejects malformed UUIDs and duplicate request IDs", () => {
    const duplicate = createValidSettings() as {
      collections: Array<{ requests: unknown[] }>;
    };
    duplicate.collections[0]?.requests.push({
      ...duplicate.collections[0]?.requests[0] as object,
      name: "Duplicate",
    });
    const malformed = createValidSettings() as {
      collections: Array<{ id: string }>;
    };
    malformed.collections[0]!.id = "not-a-uuid";

    const duplicateResult = parseExternalServicesSettings(duplicate);
    const malformedResult = parseExternalServicesSettings(malformed);

    expect(duplicateResult.ok).toBe(false);
    expect(malformedResult.ok).toBe(false);
    if (!malformedResult.ok) {
      expect(malformedResult.errors).toContainEqual({
        path: "collections[0].id",
        code: "invalid_uuid",
      });
    }
  });

  it("rejects unsupported methods, manual triggers, and invalid body values", () => {
    const settings = createValidSettings() as {
      collections: Array<{
        requests: Array<{
          method: string;
          body: { mode: string; value: string };
          triggers: Array<{ eventType: string; delaySeconds: number }>;
        }>;
      }>;
    };
    const request = settings.collections[0]!.requests[0]!;
    request.method = "OPTIONS";
    request.body = { mode: "none", value: "must not persist" };
    request.triggers = [{ eventType: "manual_run", delaySeconds: 0 }];

    const result = parseExternalServicesSettings(settings);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        path: "collections[0].requests[0].method",
        code: "invalid",
      });
      expect(result.errors).toContainEqual({
        path: "collections[0].requests[0].body.value",
        code: "must_be_empty",
      });
      expect(result.errors).toContainEqual({
        path: "collections[0].requests[0].triggers[0]",
        code: "invalid",
      });
    }
  });

  it("rejects delay outside 0–180 seconds", () => {
    const settings = createValidSettings() as {
      collections: Array<{
        requests: Array<{
          triggers: Array<{ eventType: string; delaySeconds: number }>;
        }>;
      }>;
    };
    settings.collections[0]!.requests[0]!.triggers = [
      { eventType: "call_answered", delaySeconds: 181 },
    ];

    const result = parseExternalServicesSettings(settings);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        path: "collections[0].requests[0].triggers[0].delaySeconds",
        code: "invalid_delay",
      });
    }
  });
});
