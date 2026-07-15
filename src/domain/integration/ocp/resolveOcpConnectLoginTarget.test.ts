import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "../../settings/SettingsAccountKey.js";
import {
  createSavedAccountProfile,
  type SavedAccountProfile,
} from "../../settings/SavedAccountProfile.js";
import {
  buildOcpConnectLoginOptions,
  resolveOcpConnectLoginTarget,
} from "./resolveOcpConnectLoginTarget.js";

function mustCreateProfile(input: {
  username: string;
  domain: string;
  server: string;
}): SavedAccountProfile {
  const result = createSavedAccountProfile(input);
  if (!result.ok) {
    throw new Error(result.errors.join(","));
  }
  return result.value;
}

describe("resolveOcpConnectLoginTarget", () => {
  const profileA = mustCreateProfile({
    username: "agent-a",
    domain: "pbx.example",
    server: "sip:pbx.example",
  });
  const profileB = mustCreateProfile({
    username: "agent-b",
    domain: "pbx.example",
    server: "sip:pbx.example",
  });

  it("requires non-empty login", () => {
    expect(resolveOcpConnectLoginTarget("  ", [profileA])).toEqual({
      ok: false,
      reason: "login_required",
    });
  });

  it("resolves existing saved profile by username (case-insensitive)", () => {
    const result = resolveOcpConnectLoginTarget("Agent-A", [profileA, profileB]);
    expect(result).toEqual({
      ok: true,
      value: {
        kind: "existing",
        login: "agent-a",
        accountKey: profileA.id,
      },
    });
  });

  it("resolves new login to provisional username-only account key", () => {
    const result = resolveOcpConnectLoginTarget("new-agent", [profileA]);
    expect(result).toEqual({
      ok: true,
      value: {
        kind: "new",
        login: "new-agent",
        accountKey: createSettingsAccountKey("new-agent"),
      },
    });
  });

  it("marks ambiguous when several profiles share username", () => {
    const dup = mustCreateProfile({
      username: "agent-a",
      domain: "other.example",
      server: "sip:other.example",
    });
    expect(resolveOcpConnectLoginTarget("agent-a", [profileA, dup])).toEqual({
      ok: false,
      reason: "login_ambiguous",
    });
  });

  it("disambiguates ambiguous username with explicit accountKey", () => {
    const dup = mustCreateProfile({
      username: "agent-a",
      domain: "other.example",
      server: "sip:other.example",
    });
    const result = resolveOcpConnectLoginTarget("agent-a", [profileA, dup], dup.id);
    expect(result).toEqual({
      ok: true,
      value: {
        kind: "existing",
        login: "agent-a",
        accountKey: dup.id,
      },
    });
  });

  it("builds login options from saved profiles", () => {
    expect(buildOcpConnectLoginOptions([profileA, profileB])).toEqual([
      {
        login: "agent-a",
        accountKey: profileA.id,
        displayName: profileA.displayName,
      },
      {
        login: "agent-b",
        accountKey: profileB.id,
        displayName: profileB.displayName,
      },
    ]);
  });
});
