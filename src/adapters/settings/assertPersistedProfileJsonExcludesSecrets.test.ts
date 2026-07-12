import { describe, expect, it } from "vitest";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";

describe("assertPersistedProfileJsonExcludesSecrets", () => {
  it("allows UserSettings-shaped JSON without secret fields", () => {
    expect(() =>
      assertPersistedProfileJsonExcludesSecrets(
        JSON.stringify({
          schemaVersion: 6,
          language: "ru",
          theme: "light",
          multiSessionsEnabled: true,
        }),
      ),
    ).not.toThrow();
  });

  it("rejects JSON objects with password field names", () => {
    expect(() =>
      assertPersistedProfileJsonExcludesSecrets(JSON.stringify({ password: "secret" })),
    ).toThrow("settings_persist_forbidden_secret_field:password");
  });

  it("rejects nested credential fields", () => {
    expect(() =>
      assertPersistedProfileJsonExcludesSecrets(
        JSON.stringify({ account: { sipPassword: "secret" } }),
      ),
    ).toThrow("settings_persist_forbidden_secret_field:sipPassword");
  });

  it("allows active profile index documents", () => {
    expect(() =>
      assertPersistedProfileJsonExcludesSecrets(
        JSON.stringify({ schemaVersion: 1, activeProfileKey: "1001@pbx.example" }),
      ),
    ).not.toThrow();
  });
});
