import { describe, expect, it } from "vitest";
import {
  createSavedAccountProfile,
  parsePersistedSavedAccountProfilesDocument,
  serializeSavedAccountProfilesDocument,
  SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
} from "@domain/index.js";

describe("serializeSavedAccountProfilesDocument", () => {
  it("serializes profiles without secret fields", () => {
    const created = createSavedAccountProfile({
      username: "alex.supervisor",
      domain: "corp.example",
      server: "wss://sip.corp.example/ws",
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const json = serializeSavedAccountProfilesDocument([created.value]);
    const parsed = JSON.parse(json) as Record<string, unknown>;

    expect(parsed["schemaVersion"]).toBe(SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION);
    expect(json.includes("password")).toBe(false);
    expect(json.includes("token")).toBe(false);
  });
});

describe("parsePersistedSavedAccountProfilesDocument", () => {
  it("parses valid document round-trip", () => {
    const created = createSavedAccountProfile(
      {
        username: "yura.operator",
        domain: "pbx.example",
        server: "wss://pbx.example/ws",
      },
      { createdAt: "2026-07-06T10:00:00.000Z" },
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const json = serializeSavedAccountProfilesDocument([created.value]);
    const parsed = parsePersistedSavedAccountProfilesDocument(JSON.parse(json) as unknown);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.profiles).toHaveLength(1);
    expect(parsed.value.profiles[0]?.username).toBe("yura.operator");
    expect(parsed.value.profiles[0]?.createdAt).toBe("2026-07-06T10:00:00.000Z");
  });

  it("rejects unsupported schema version", () => {
    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: 99,
      profiles: [],
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "unsupported_schema_version" },
    });
  });

  it("migrates legacy schema v1 profiles to successful lifecycle", () => {
    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: 1,
      profiles: [
        {
          id: "agent@pbx.example",
          username: "agent",
          domain: "pbx.example",
          server: "wss://pbx.example/ws",
          displayName: "agent",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.schemaVersion).toBe(SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION);
    expect(result.value.profiles[0]?.lifecycleStatus).toBe("successful");
  });

  it("rejects invalid shape", () => {
    expect(parsePersistedSavedAccountProfilesDocument(null)).toEqual({
      ok: false,
      error: { code: "invalid_shape" },
    });
    expect(
      parsePersistedSavedAccountProfilesDocument({
        schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
        profiles: "not-an-array",
      }),
    ).toEqual({
      ok: false,
      error: { code: "invalid_shape" },
    });
  });

  it("rejects persisted secret fields", () => {
    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
      profiles: [
        {
          id: "agent@pbx.example",
          username: "agent",
          domain: "pbx.example",
          server: "wss://pbx.example/ws",
          displayName: "agent",
          password: "secret",
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "forbidden_secret_field" },
    });
  });

  it("skips duplicate profile ids conservatively", () => {
    const entry = {
      id: "agent@pbx.example",
      username: "agent",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
      displayName: "agent",
    };

    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
      profiles: [entry, entry],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.profiles).toHaveLength(1);
  });

  it("rejects profile entry with mismatched id", () => {
    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
      profiles: [
        {
          id: "wrong-id",
          username: "agent",
          domain: "pbx.example",
          server: "wss://pbx.example/ws",
          displayName: "agent",
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_profile_entry" },
    });
  });

  it("rejects profile entry missing required fields", () => {
    const result = parsePersistedSavedAccountProfilesDocument({
      schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
      profiles: [{ id: "agent@pbx.example", username: "agent" }],
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_profile_entry" },
    });
  });
});
