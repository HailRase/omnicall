import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
  isCompositeSettingsAccountKey,
} from "@domain/index.js";

describe("deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity", () => {
  it("normalizes username without domain segment", () => {
    const key = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
      username: " 1001 ",
      domain: "PBX.Example",
      server: "wss://pbx.example/ws",
    });

    expect(key).toBe(createSettingsAccountKey("1001"));
  });

  it("returns anonymous key when username is blank", () => {
    const key = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
      username: "   ",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    expect(key).toBe(createSettingsAccountKey("__anonymous__"));
  });

  it("differs from composite key for the same identity", () => {
    const identity = {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    expect(deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(identity)).toBe(
      createSettingsAccountKey("1001"),
    );
    expect(deriveSettingsAccountKeyFromIdentity(identity)).toBe(
      createSettingsAccountKey("1001@pbx.example"),
    );
  });
});

describe("isCompositeSettingsAccountKey", () => {
  it("returns true for username@domain keys", () => {
    expect(isCompositeSettingsAccountKey(createSettingsAccountKey("1001@pbx.example"))).toBe(
      true,
    );
  });

  it("returns true for server-suffixed composite keys", () => {
    expect(
      isCompositeSettingsAccountKey(
        createSettingsAccountKey("1001@pbx.example|alt-pbx.example"),
      ),
    ).toBe(true);
  });

  it("returns false for username-only legacy keys", () => {
    expect(isCompositeSettingsAccountKey(createSettingsAccountKey("1001"))).toBe(false);
  });

  it("returns false for anonymous bucket", () => {
    expect(isCompositeSettingsAccountKey(createSettingsAccountKey("__anonymous__"))).toBe(false);
  });
});
