// @vitest-environment jsdom
import { describe, expect, it } from "vitest";import { createSettingsAccountKey } from "@domain/index.js";
import {
  decodeProfileKeyFromFileName,
  encodeProfileKeyForFileName,
  resolveExternalServicesJournalFilePath,
  resolveProfileSettingsFilePath,
} from "./profileStoragePaths.js";

describe("profileStoragePaths", () => {
  it("round-trips profile keys with special characters via base64url filenames", () => {
    const accountKey = createSettingsAccountKey("1001@tenant.example|edge.sbc.example");
    const encoded = encodeProfileKeyForFileName(accountKey);

    expect(encoded).not.toContain("@");
    expect(encoded).not.toContain("|");
    expect(decodeProfileKeyFromFileName(encoded)).toBe(accountKey);
  });

  it("matches Node base64url encoding for persisted filename compatibility", () => {
    const accountKey = createSettingsAccountKey("1001@pbx.example");
    const encoded = encodeProfileKeyForFileName(accountKey);

    expect(encoded).toBe("MTAwMUBwYnguZXhhbXBsZQ");
    expect(decodeProfileKeyFromFileName(encoded)).toBe(accountKey);
  });

  it("round-trips utf-8 profile keys without Node Buffer APIs", () => {
    const accountKey = createSettingsAccountKey("оператор@домен.example");
    const encoded = encodeProfileKeyForFileName(accountKey);

    expect(decodeProfileKeyFromFileName(encoded)).toBe(accountKey);
  });

  it("resolves settings file path under profiles/settings directory", () => {
    const accountKey = createSettingsAccountKey("1001@pbx.example");
    const filePath = resolveProfileSettingsFilePath("/tmp/omnicall", accountKey);

    expect(filePath).toContain("profiles");
    expect(filePath).toContain("settings");
    expect(filePath.endsWith(".json")).toBe(true);
  });

  it("resolves External Services journal path under profiles/external-services-journal", () => {
    const accountKey = createSettingsAccountKey("1001@pbx.example");
    const filePath = resolveExternalServicesJournalFilePath(
      "/tmp/omnicall",
      accountKey,
    );

    expect(filePath).toContain("profiles");
    expect(filePath).toContain("external-services-journal");
    expect(filePath.endsWith(".json")).toBe(true);
  });
});
