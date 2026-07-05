import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  createSipAccountId,
  resolveSettingsAccountKeyFromSipAccount,
} from "@domain/index.js";
import { createSipAccount } from "@domain/telephony/SipAccount.js";

describe("resolveSettingsAccountKeyFromSipAccount", () => {
  it("uses anonymous bucket when SIP account is missing", () => {
    expect(resolveSettingsAccountKeyFromSipAccount(null)).toBe(
      createSettingsAccountKey("__anonymous__"),
    );
  });

  it("derives composite username@domain key from SIP account", () => {
    const account = createSipAccount(createSipAccountId("acc-1"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    expect(resolveSettingsAccountKeyFromSipAccount(account)).toBe(
      createSettingsAccountKey("1001@pbx.example"),
    );
  });

  it("includes server suffix when account server host differs from domain", () => {
    const account = createSipAccount(createSipAccountId("acc-2"), {
      username: "1001",
      password: "secret",
      domain: "tenant.example",
      server: "wss://edge.sbc.example/ws",
    });

    expect(resolveSettingsAccountKeyFromSipAccount(account)).toBe(
      createSettingsAccountKey("1001@tenant.example|edge.sbc.example"),
    );
  });

  it("never includes password in derived key", () => {
    const account = createSipAccount(createSipAccountId("acc-3"), {
      username: "1001",
      password: "super-secret-password",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    const key = resolveSettingsAccountKeyFromSipAccount(account);
    expect(String(key)).not.toContain("super-secret-password");
    expect(String(key)).not.toContain("secret");
  });
});
