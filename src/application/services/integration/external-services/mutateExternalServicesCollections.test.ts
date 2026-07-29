import { describe, expect, it } from "vitest";
import type { UuidGenerator } from "@ports/index.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
} from "./externalServicesTestFixtures.js";
import {
  createExternalServiceCollection,
  deleteExternalServiceCollection,
  duplicateExternalServiceCollection,
  renameExternalServiceCollection,
  replaceExternalServiceCollectionVariables,
  toggleExternalServiceCollection,
} from "./mutateExternalServicesCollections.js";

const uuidGenerator: UuidGenerator = {
  generate: () => "d0b1c2d3-e4f5-4a67-8b90-123456789012",
};

describe("mutateExternalServicesCollections", () => {
  it("creates, renames, toggles, duplicates, and deletes collections", () => {
    const empty = { collections: [] };
    const created = createExternalServiceCollection(empty, "  CRM  ", uuidGenerator);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const renamed = renameExternalServiceCollection(
      created.settings,
      "d0b1c2d3-e4f5-4a67-8b90-123456789012",
      "Billing",
    );
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }
    expect(renamed.settings.collections[0]?.name).toBe("Billing");

    const toggled = toggleExternalServiceCollection(
      renamed.settings,
      "d0b1c2d3-e4f5-4a67-8b90-123456789012",
      false,
    );
    expect(toggled.ok).toBe(true);
    if (!toggled.ok) {
      return;
    }
    expect(toggled.settings.collections[0]?.enabled).toBe(false);

    const duplicated = duplicateExternalServiceCollection(
      createExternalServicesTestSettings(),
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      {
        generate: (() => {
          let index = 0;
          const ids = [
            "e0b1c2d3-e4f5-4a67-8b90-123456789012",
            "f0b1c2d3-e4f5-4a67-8b90-123456789012",
            "a1b1c2d3-e4f5-4a67-8b90-123456789012",
          ];
          return () => ids[index++] ?? "b1b1c2d3-e4f5-4a67-8b90-123456789012";
        })(),
      },
    );
    expect(duplicated.ok).toBe(true);
    if (!duplicated.ok) {
      return;
    }
    expect(duplicated.settings.collections).toHaveLength(2);
    expect(duplicated.settings.collections[1]?.name).toBe("CRM (copy)");
    expect(duplicated.settings.collections[1]?.id).not.toBe(
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
    );

    const deleted = deleteExternalServiceCollection(
      duplicated.settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
    );
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) {
      return;
    }
    expect(deleted.settings.collections).toHaveLength(1);
  });

  it("rejects blank names and replaces variables", () => {
    const settings = createExternalServicesTestSettings();
    expect(createExternalServiceCollection(settings, "   ", uuidGenerator)).toEqual({
      ok: false,
      error: "name_required",
    });

    const replaced = replaceExternalServiceCollectionVariables(
      settings,
      EXTERNAL_SERVICES_TEST_COLLECTION_ID,
      [
        { key: " token ", value: "abc" },
        { key: "", value: "ignored" },
      ],
    );
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) {
      return;
    }
    expect(replaced.settings.collections[0]?.variables).toEqual([
      { key: "token", value: "abc" },
    ]);
  });
});
