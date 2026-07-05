import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  createSipAccount,
  createSipAccountId,
  resolveSettingsAccountKeyFromSipAccount,
} from "@domain/index.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { resolveSettingsAccountKey } from "./resolveSettingsAccountKey.js";

describe("resolveSettingsAccountKey", () => {
  it("returns active profile key when no SIP account is authorized", async () => {
    const repository = new InMemorySettingsRepository({
      activeProfileKey: createSettingsAccountKey("1001@pbx.example"),
    });

    expect(await resolveSettingsAccountKey(repository)).toBe(
      createSettingsAccountKey("1001@pbx.example"),
    );
  });

  it("prefers active profile key when aligned with SIP account identity", async () => {
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const profileKey = resolveSettingsAccountKeyFromSipAccount(account);
    const repository = new InMemorySettingsRepository({
      sipAccount: account,
      activeProfileKey: profileKey,
    });

    expect(await resolveSettingsAccountKey(repository)).toBe(profileKey);
  });

  it("falls back to SIP identity key when active profile is misaligned", async () => {
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const repository = new InMemorySettingsRepository({
      sipAccount: account,
      activeProfileKey: createSettingsAccountKey("stale@profile.example"),
    });

    expect(await resolveSettingsAccountKey(repository)).toBe(
      resolveSettingsAccountKeyFromSipAccount(account),
    );
  });
});
