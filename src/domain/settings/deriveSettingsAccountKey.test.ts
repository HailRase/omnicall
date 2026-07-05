import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  deriveSettingsAccountKeyFromIdentity,
  extractSipServerHost,
  normalizeSettingsAccountDomain,
  normalizeSettingsAccountUsername,
} from "@domain/index.js";

describe("normalizeSettingsAccountUsername", () => {
  it("trims and lowercases username", () => {
    expect(normalizeSettingsAccountUsername("  Agent-42  ")).toBe("agent-42");
  });
});

describe("normalizeSettingsAccountDomain", () => {
  it("normalizes URL-shaped domain input", () => {
    expect(normalizeSettingsAccountDomain("https://PBX.Example/path")).toBe("pbx.example");
  });

  it("lowercases bare domain hostnames", () => {
    expect(normalizeSettingsAccountDomain("SBC.Corp.local")).toBe("sbc.corp.local");
  });
});

describe("extractSipServerHost", () => {
  it("extracts host from secure websocket URL", () => {
    expect(extractSipServerHost("wss://pbx.example/ws")).toBe("pbx.example");
  });

  it("extracts host from host:port input", () => {
    expect(extractSipServerHost("alt-pbx.example:7443")).toBe("alt-pbx.example");
  });

  it("returns empty for blank server", () => {
    expect(extractSipServerHost("   ")).toBe("");
  });
});

describe("deriveSettingsAccountKeyFromIdentity", () => {
  it("builds username@domain key with normalization", () => {
    const key = deriveSettingsAccountKeyFromIdentity({
      username: " 1001 ",
      domain: "PBX.Example",
      server: "wss://pbx.example/ws",
    });

    expect(key).toBe(createSettingsAccountKey("1001@pbx.example"));
  });

  it("appends server host suffix when server host differs from domain", () => {
    const key = deriveSettingsAccountKeyFromIdentity({
      username: "1001",
      domain: "pbx.example",
      server: "wss://edge.sbc.example/ws",
    });

    expect(key).toBe(createSettingsAccountKey("1001@pbx.example|edge.sbc.example"));
  });

  it("does not append suffix when server host equals domain", () => {
    const key = deriveSettingsAccountKeyFromIdentity({
      username: "1001",
      domain: "pbx.example",
      server: "wss://PBX.EXAMPLE:443/ws",
    });

    expect(key).toBe(createSettingsAccountKey("1001@pbx.example"));
  });

  it("returns anonymous bucket when username is blank", () => {
    const key = deriveSettingsAccountKeyFromIdentity({
      username: "   ",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    expect(key).toBe(createSettingsAccountKey("__anonymous__"));
  });

  it("returns anonymous bucket when domain is blank", () => {
    const key = deriveSettingsAccountKeyFromIdentity({
      username: "1001",
      domain: "   ",
      server: "wss://pbx.example/ws",
    });

    expect(key).toBe(createSettingsAccountKey("__anonymous__"));
  });

  it("derives distinct keys for same AOR on different PBX hosts", () => {
    const identity = {
      username: "1001",
      domain: "tenant.example",
    };

    const keyA = deriveSettingsAccountKeyFromIdentity({
      ...identity,
      server: "wss://pbx-a.example/ws",
    });
    const keyB = deriveSettingsAccountKeyFromIdentity({
      ...identity,
      server: "wss://pbx-b.example/ws",
    });

    expect(keyA).not.toBe(keyB);
    expect(keyA).toBe(createSettingsAccountKey("1001@tenant.example|pbx-a.example"));
    expect(keyB).toBe(createSettingsAccountKey("1001@tenant.example|pbx-b.example"));
  });

  it("derives same key for equivalent server host forms", () => {
    const base = {
      username: "1001",
      domain: "pbx.example",
    };

    const fromWs = deriveSettingsAccountKeyFromIdentity({
      ...base,
      server: "wss://pbx.example/ws",
    });
    const fromHostPort = deriveSettingsAccountKeyFromIdentity({
      ...base,
      server: "pbx.example:7443",
    });

    expect(fromWs).toBe(fromHostPort);
  });
});
