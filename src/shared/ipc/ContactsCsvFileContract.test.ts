import { describe, expect, it } from "vitest";
import {
  parseContactsCsvOpenImportDialogResponse,
  parseContactsCsvSaveExportDialogPayload,
  parseContactsCsvSaveExportDialogResponse,
  sanitizeContactsCsvSavedFileName,
} from "./ContactsCsvFileContract.js";

describe("ContactsCsvFileContract", () => {
  it("parses valid save-export payload without requiring Node Buffer", () => {
    const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
    const originalBuffer = globalWithBuffer.Buffer;
    Reflect.deleteProperty(globalWithBuffer, "Buffer");

    try {
      expect(
        parseContactsCsvSaveExportDialogPayload({
          contents: "displayName,primaryPhone\nAlex,+1202",
          suggestedFileName: "contacts-export.csv",
        }),
      ).toEqual({
        contents: "displayName,primaryPhone\nAlex,+1202",
        suggestedFileName: "contacts-export.csv",
      });
    } finally {
      if (originalBuffer !== undefined) {
        globalWithBuffer.Buffer = originalBuffer;
      }
    }
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
    expect(parseContactsCsvSaveExportDialogResponse({ ok: true, cancelled: false, savedFileName: "contacts-export.csv" })).toEqual({
      ok: true,
      cancelled: false,
      savedFileName: "contacts-export.csv",
    });
    expect(parseContactsCsvSaveExportDialogResponse({ ok: true, cancelled: false })).toEqual({
      ok: true,
      cancelled: false,
      savedFileName: "contacts-export.csv",
    });
    expect(
      parseContactsCsvSaveExportDialogResponse({
        ok: true,
        cancelled: false,
        savedFileName: "Контакты экспорт.csv",
      }),
    ).toEqual({
      ok: true,
      cancelled: false,
      savedFileName: "contacts-export.csv",
    });
    expect(parseContactsCsvSaveExportDialogResponse({ ok: false, reason: "write_failed" })).toEqual({
      ok: false,
      reason: "write_failed",
    });
  });

  it("sanitizes unsafe saved file names", () => {
    expect(sanitizeContactsCsvSavedFileName("My Contacts.csv")).toBe("My-Contacts.csv");
    expect(sanitizeContactsCsvSavedFileName("файл.csv")).toBe("contacts-export.csv");
    expect(sanitizeContactsCsvSavedFileName(null)).toBe("contacts-export.csv");
  });
});
