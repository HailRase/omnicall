/**
 * - Purpose: contract tests for External Services collection file IPC parsers.
 * - Inputs: valid and invalid dialog payloads/responses.
 * - Outputs: acceptance and rejection coverage including size bounds.
 */

import { describe, expect, it } from "vitest";
import { EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES as DOMAIN_MAX_BYTES } from "@domain/integration/external-services/ExternalServiceCollectionDocument.js";
import {
  EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES,
  parseExternalServicesCollectionOpenImportDialogResponse,
  parseExternalServicesCollectionSaveExportDialogPayload,
  parseExternalServicesCollectionSaveExportDialogResponse,
  sanitizeExternalServicesCollectionSavedFileName,
} from "./ExternalServicesCollectionFileContract.js";

describe("ExternalServicesCollectionFileContract", () => {
  it("keeps IPC size cap aligned with domain document limit", () => {
    expect(EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES).toBe(DOMAIN_MAX_BYTES);
  });

  it("accepts valid save payload and dialog responses", () => {
    expect(
      parseExternalServicesCollectionSaveExportDialogPayload({
        contents: "{\"formatVersion\":1}",
        suggestedFileName: "omnicall-external-service-crm.json",
      }),
    ).toEqual({
      contents: "{\"formatVersion\":1}",
      suggestedFileName: "omnicall-external-service-crm.json",
    });

    expect(
      parseExternalServicesCollectionOpenImportDialogResponse({
        ok: true,
        cancelled: false,
        contents: "{}",
      }),
    ).toEqual({ ok: true, cancelled: false, contents: "{}" });

    expect(
      parseExternalServicesCollectionSaveExportDialogResponse({
        ok: true,
        cancelled: false,
        savedFileName: "crm.json",
      }),
    ).toEqual({ ok: true, cancelled: false, savedFileName: "crm.json" });
  });

  it("rejects oversized payloads and unsafe filenames", () => {
    const oversized = "x".repeat(EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES + 1);
    expect(
      parseExternalServicesCollectionSaveExportDialogPayload({
        contents: oversized,
        suggestedFileName: "ok.json",
      }),
    ).toBeNull();

    expect(
      parseExternalServicesCollectionSaveExportDialogPayload({
        contents: "{}",
        suggestedFileName: "../escape.json",
      }),
    ).toBeNull();

    expect(
      parseExternalServicesCollectionOpenImportDialogResponse({
        ok: true,
        cancelled: false,
        contents: oversized,
      }),
    ).toEqual({ ok: false, reason: "file_too_large" });
  });

  it("sanitizes saved filenames to ascii json basenames", () => {
    expect(sanitizeExternalServicesCollectionSavedFileName("CRM Hook!.json")).toBe(
      "CRM-Hook.json",
    );
    expect(sanitizeExternalServicesCollectionSavedFileName(12)).toBe(
      "omnicall-external-service-collection.json",
    );
  });
});
