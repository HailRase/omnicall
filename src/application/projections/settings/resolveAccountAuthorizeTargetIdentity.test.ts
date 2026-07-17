import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@domain/index.js";
import type { SavedAccountProfile } from "@domain/index.js";
import { resolveAccountAuthorizeTargetIdentity } from "./resolveAccountAuthorizeTargetIdentity.js";

const savedProfile: SavedAccountProfile = {
  id: createSettingsAccountKey("1001@pbx.example.com"),
  username: "1001",
  domain: "pbx.example.com",
  server: "wss://sip.example.com",
  displayName: "1001",
  lifecycleStatus: "successful",
};

describe("resolveAccountAuthorizeTargetIdentity", () => {
  it("returns saved profile identity when a profile is selected", () => {
    expect(
      resolveAccountAuthorizeTargetIdentity(
        { username: "", password: "", domain: "", server: "" },
        savedProfile,
      ),
    ).toEqual({
      username: "1001",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
    });
  });

  it("returns manual form identity when no profile is selected", () => {
    expect(
      resolveAccountAuthorizeTargetIdentity(
        {
          username: "agent",
          password: "secret",
          domain: "example.com",
          server: "sip.example.com",
        },
        null,
      ),
    ).toEqual({
      username: "agent",
      domain: "example.com",
      server: "sip.example.com",
    });
  });

  it("returns null when manual form identity is incomplete", () => {
    expect(
      resolveAccountAuthorizeTargetIdentity(
        { username: "agent", password: "", domain: "", server: "" },
        null,
      ),
    ).toBeNull();
  });
});
