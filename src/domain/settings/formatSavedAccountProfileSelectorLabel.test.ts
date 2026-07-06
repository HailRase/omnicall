import { describe, expect, it } from "vitest";
import { createSavedAccountProfile, type SavedAccountProfile } from "./SavedAccountProfile.js";
import { formatSavedAccountProfileSelectorLabel } from "./formatSavedAccountProfileSelectorLabel.js";

function profile(
  username: string,
  domain: string,
  server: string,
): SavedAccountProfile {
  const created = createSavedAccountProfile({ username, domain, server });
  if (!created.ok) {
    throw new Error("profile fixture failed");
  }
  return created.value;
}

describe("formatSavedAccountProfileSelectorLabel", () => {
  it("returns username when it is unique in the list", () => {
    const profiles = [
      profile("agent-a", "pbx.one", "wss://sip.one"),
      profile("agent-b", "pbx.two", "wss://sip.two"),
    ];

    expect(formatSavedAccountProfileSelectorLabel(profiles[0]!, profiles)).toBe("agent-a");
  });

  it("appends domain when the same username appears on different domains", () => {
    const profiles = [
      profile("1001", "pbx.one", "wss://sip.one"),
      profile("1001", "pbx.two", "wss://sip.two"),
    ];

    expect(formatSavedAccountProfileSelectorLabel(profiles[0]!, profiles)).toBe(
      "1001 @ pbx.one",
    );
    expect(formatSavedAccountProfileSelectorLabel(profiles[1]!, profiles)).toBe(
      "1001 @ pbx.two",
    );
  });

  it("appends server when username and domain collide", () => {
    const profiles = [
      profile("1001", "pbx.example.com", "wss://sip-a.example.com"),
      profile("1001", "pbx.example.com", "wss://sip-b.example.com"),
    ];

    expect(formatSavedAccountProfileSelectorLabel(profiles[0]!, profiles)).toBe(
      "1001 @ pbx.example.com (wss://sip-a.example.com)",
    );
  });
});
