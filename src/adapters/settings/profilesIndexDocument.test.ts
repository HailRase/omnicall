import { describe, expect, it } from "vitest";
import { parseProfilesIndex, serializeProfilesIndex } from "./profilesIndexDocument.js";

describe("profilesIndexDocument", () => {
  it("round-trips active profile index document", () => {
    const document = {
      schemaVersion: 1 as const,
      activeProfileKey: "1001@pbx.example",
    };

    const parsed = parseProfilesIndex(JSON.parse(serializeProfilesIndex(document)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual(document);
    }
  });

  it("rejects unsupported schema version", () => {
    const parsed = parseProfilesIndex({ schemaVersion: 2, activeProfileKey: null });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("unsupported_schema_version");
    }
  });
});
