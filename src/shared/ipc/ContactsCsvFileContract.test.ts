import { describe, expect, it } from "vitest";
import {
  parseContactsCsvOpenImportDialogResponse,
  parseContactsCsvSaveExportDialogPayload,
  parseContactsCsvSaveExportDialogResponse,
} from "./ContactsCsvFileContract.js";

describe("ContactsCsvFileContract", () => {
  it("parses valid save-export payload", () => {
    expect(
      parseContactsCsvSaveExportDialogPayload({
        contents: "displayName,primaryPhone\nAlex,+1202",
        suggestedFileName: "contacts-export.csv",
      }),
    ).toEqual({
      contents: "displayName,primaryPhone\nAlex,+1202",
      suggestedFileName: "contacts-export.csv",
    });
  });

  it("rejects invalid save-export payloads", () => {
    expect(parseContactsCsvSaveExportDialogPayload(null)).toBeNull();
    expect(parseContactsCsvSaveExportDialogPayload({ contents: "", suggestedFileName: "x.csv" })).toBeNull();
    expect(
      parseContactsCsvSaveExportDialogPayload({
        contents: "ok",
        suggestedFileName: "../escape.csv",
      }),
    ).toBeNull();
  });

  it("parses import and save dialog responses", () => {
    expect(parseContactsCsvOpenImportDialogResponse({ ok: true, cancelled: true })).toEqual({
      ok: true,
      cancelled: true,
    });
    expect(
      parseContactsCsvOpenImportDialogResponse({
        ok: true,
        cancelled: false,
        contents: "csv",
      }),
    ).toEqual({
      ok: true,
      cancelled: false,
      contents: "csv",
    });
    expect(parseContactsCsvSaveExportDialogResponse({ ok: true, cancelled: false })).toEqual({
      ok: true,
      cancelled: false,
    });
    expect(parseContactsCsvSaveExportDialogResponse({ ok: false, reason: "write_failed" })).toEqual({
      ok: false,
      reason: "write_failed",
    });
  });
});
