import { describe, expect, it } from "vitest";
import type { UuidGenerator } from "@ports/index.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
  EXTERNAL_SERVICES_TEST_REQUEST_ID,
} from "./externalServicesTestFixtures.js";
import {
  createExternalServiceRequest,
  deleteExternalServiceRequest,
  duplicateExternalServiceRequest,
  renameExternalServiceRequest,
  replaceExternalServiceRequest,
  toggleExternalServiceRequest,
} from "./mutateExternalServicesRequests.js";

const UUIDS = [
  "d0b1c2d3-e4f5-4a67-8b90-123456789012",
  "e0b1c2d3-e4f5-4a67-8b90-123456789012",
  "f0b1c2d3-e4f5-4a67-8b90-123456789012",
];

describe("mutateExternalServicesRequests", () => {
  it("creates, renames, toggles, duplicates, and deletes requests immutably", () => {
    const settings = createExternalServicesTestSettings();
    const created = createExternalServiceRequest(
      settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      uuidGenerator(UUIDS),
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.settings.collections[0]?.requests[1]).toMatchObject({
      id: UUIDS[0],
      name: "New request",
      method: "GET",
      url: "https://example.com",
      body: { mode: "none", value: "" },
    });
    expect(settings.collections[0]?.requests).toHaveLength(1);

    const renamed = renameExternalServiceRequest(
      created.settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      UUIDS[0]!,
      "  Health check  ",
    );
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }
    expect(renamed.settings.collections[0]?.requests[1]?.name).toBe("Health check");

    const toggled = toggleExternalServiceRequest(
      renamed.settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      UUIDS[0]!,
      false,
    );
    expect(toggled.ok).toBe(true);
    if (!toggled.ok) {
      return;
    }
    expect(toggled.settings.collections[0]?.requests[1]?.enabled).toBe(false);

    const duplicated = duplicateExternalServiceRequest(
      settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      EXTERNAL_SERVICES_TEST_REQUEST_ID,
      uuidGenerator(UUIDS.slice(1)),
    );
    expect(duplicated.ok).toBe(true);
    if (!duplicated.ok) {
      return;
    }
    const duplicate = duplicated.settings.collections[0]?.requests[1];
    expect(duplicate?.id).toBe(UUIDS[1]);
    expect(duplicate?.headers[0]?.id).toBe(UUIDS[2]);
    expect(duplicate?.headers[0]?.id).not.toBe(
      settings.collections[0]?.requests[0]?.headers[0]?.id,
    );

    const deleted = deleteExternalServiceRequest(
      duplicated.settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      UUIDS[1]!,
    );
    expect(deleted).toMatchObject({ ok: true });
    if (deleted.ok) {
      expect(deleted.settings.collections[0]?.requests).toHaveLength(1);
    }
  });

  it("validates names and rejects invalid full replacements", () => {
    const settings = createExternalServicesTestSettings();
    expect(
      renameExternalServiceRequest(
        settings,
        EXTERNAL_SERVICES_TEST_COLLECTION_ID,
        EXTERNAL_SERVICES_TEST_REQUEST_ID,
        "  ",
      ),
    ).toEqual({ ok: false, error: "name_required" });

    const request = settings.collections[0]?.requests[0];
    expect(request).toBeDefined();
    if (request === undefined) {
      return;
    }
    expect(
      replaceExternalServiceRequest(
        settings,
        EXTERNAL_SERVICES_TEST_COLLECTION_ID,
        EXTERNAL_SERVICES_TEST_REQUEST_ID,
        { ...request, url: "" },
      ),
    ).toEqual({ ok: false, error: "invalid_request" });

    const replaced = replaceExternalServiceRequest(
      settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      EXTERNAL_SERVICES_TEST_REQUEST_ID,
      { ...request, method: "PATCH", url: "https://crm.example.test/events/1" },
    );
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      expect(replaced.settings.collections[0]?.requests[0]?.method).toBe("PATCH");
    }
  });

  it("reports missing collection and request identifiers", () => {
    const settings = createExternalServicesTestSettings();
    expect(
      createExternalServiceRequest(
        settings,
        "missing-collection",
        uuidGenerator(UUIDS),
      ),
    ).toEqual({ ok: false, error: "collection_not_found" });
    expect(
      deleteExternalServiceRequest(
        settings,
        EXTERNAL_SERVICES_TEST_COLLECTION_ID,
        "missing-request",
      ),
    ).toEqual({ ok: false, error: "request_not_found" });
  });
});

function uuidGenerator(ids: ReadonlyArray<string>): UuidGenerator {
  let index = 0;
  return {
    generate: () => ids[index++] ?? UUIDS[0]!,
  };
}
