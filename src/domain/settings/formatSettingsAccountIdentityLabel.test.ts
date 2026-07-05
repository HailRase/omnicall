import { describe, expect, it } from "vitest";
import { formatSettingsAccountIdentityLabel } from "./formatSettingsAccountIdentityLabel.js";

describe("formatSettingsAccountIdentityLabel", () => {
  it("returns username@domain for valid identity", () => {
    expect(formatSettingsAccountIdentityLabel("1001", "pbx.example.com")).toBe(
      "1001@pbx.example.com",
    );
  });

  it("trims username and normalizes URL-shaped domain", () => {
    expect(
      formatSettingsAccountIdentityLabel(" agent ", "https://Pbx.Example.com/path"),
    ).toBe("agent@pbx.example.com");
  });

  it("returns null when username or domain is blank", () => {
    expect(formatSettingsAccountIdentityLabel("", "example.com")).toBeNull();
    expect(formatSettingsAccountIdentityLabel("user", "")).toBeNull();
  });
});
