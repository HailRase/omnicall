import { describe, expect, it } from "vitest";
import {
  areSavedAccountProfilesSameIdentity,
  createSavedAccountProfile,
  createSavedAccountProfileId,
  createSettingsAccountKey,
  deriveSavedAccountProfileId,
  findSavedAccountProfileByInput,
  normalizeSavedAccountProfileFields,
  validateSavedAccountProfileInput,
  assertSavedAccountProfileValueExcludesSecrets,
} from "@domain/index.js";

describe("normalizeSavedAccountProfileFields", () => {
  it("trims username and server and normalizes domain URL", () => {
    expect(
      normalizeSavedAccountProfileFields({
        username: "  alex.supervisor ",
        domain: "https://PBX.Example/path",
        server: " wss://pbx.example/ws ",
      }),
    ).toEqual({
      username: "alex.supervisor",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });
  });
});

describe("validateSavedAccountProfileInput", () => {
  it("requires username, domain, and server", () => {
    expect(
      validateSavedAccountProfileInput({
        username: "   ",
        domain: "",
        server: "  ",
      }),
    ).toEqual(["username_required", "domain_required", "server_required"]);
  });

  it("accepts valid metadata without password field", () => {
    expect(
      validateSavedAccountProfileInput({
        username: "max.operator",
        domain: "pbx.example",
        server: "wss://pbx.example/ws",
      }),
    ).toEqual([]);
  });
});

describe("deriveSavedAccountProfileId", () => {
  it("matches settings account key derivation", () => {
    const identity = {
      username: "1001",
      domain: "tenant.example",
      server: "wss://pbx-a.example/ws",
    };

    expect(deriveSavedAccountProfileId(identity)).toBe(
      createSettingsAccountKey("1001@tenant.example|pbx-a.example"),
    );
  });

  it("produces stable id for equivalent server host forms", () => {
    const base = {
      username: "yura.operator",
      domain: "pbx.example",
    };

    const fromWs = deriveSavedAccountProfileId({
      ...base,
      server: "wss://pbx.example/ws",
    });
    const fromHostPort = deriveSavedAccountProfileId({
      ...base,
      server: "pbx.example:7443",
    });

    expect(fromWs).toBe(fromHostPort);
  });
});

describe("createSavedAccountProfile", () => {
  it("builds profile with displayName from username", () => {
    const result = createSavedAccountProfile({
      username: "alex.supervisor",
      domain: "corp.example",
      server: "wss://corp.example/ws",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value).toMatchObject({
      id: createSavedAccountProfileId("alex.supervisor@corp.example"),
      username: "alex.supervisor",
      domain: "corp.example",
      displayName: "alex.supervisor",
    });
  });

  it("rejects incomplete input", () => {
    const result = createSavedAccountProfile({
      username: "",
      domain: "corp.example",
      server: "wss://sip.corp.example/ws",
    });

    expect(result).toEqual({ ok: false, errors: ["username_required"] });
  });
});

describe("duplicate identity detection", () => {
  it("detects same normalized identity across trailing spaces and URL domain", () => {
    const profile = createSavedAccountProfile({
      username: "max.operator",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }

    const duplicate = findSavedAccountProfileByInput([profile.value], {
      username: "  max.operator ",
      domain: "https://pbx.example",
      server: "wss://pbx.example/ws",
    });

    expect(duplicate?.id).toBe(profile.value.id);
    expect(areSavedAccountProfilesSameIdentity(profile.value, duplicate as typeof profile.value)).toBe(
      true,
    );
  });

  it("treats same username on different servers as distinct profiles", () => {
    const profileA = createSavedAccountProfile({
      username: "max.operator",
      domain: "tenant.example",
      server: "wss://pbx-a.example/ws",
    });
    const profileB = createSavedAccountProfile({
      username: "max.operator",
      domain: "tenant.example",
      server: "wss://pbx-b.example/ws",
    });

    expect(profileA.ok && profileB.ok).toBe(true);
    if (!profileA.ok || !profileB.ok) {
      return;
    }

    expect(profileA.value.id).not.toBe(profileB.value.id);
    expect(
      findSavedAccountProfileByInput([profileA.value], {
        username: "max.operator",
        domain: "tenant.example",
        server: "wss://pbx-b.example/ws",
      }),
    ).toBeNull();
  });
});

describe("assertSavedAccountProfileValueExcludesSecrets", () => {
  it("rejects objects containing password fields", () => {
    expect(() => {
      assertSavedAccountProfileValueExcludesSecrets({
        username: "agent",
        password: "secret",
      });
    }).toThrow("saved_profile_forbidden_secret_field:password");
  });

  it("allows non-secret profile metadata", () => {
    expect(() => {
      assertSavedAccountProfileValueExcludesSecrets({
        username: "agent",
        domain: "pbx.example",
        server: "wss://pbx.example/ws",
      });
    }).not.toThrow();
  });
});
