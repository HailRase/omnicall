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

  it("uses SIP username as settings key", () => {
    const account = createSipAccount(createSipAccountId("acc-1"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    expect(resolveSettingsAccountKeyFromSipAccount(account)).toBe(
      createSettingsAccountKey("1001"),
    );
  });
});
