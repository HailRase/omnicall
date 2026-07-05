import { describe, expect, it } from "vitest";
import {
  createDefaultUserSettings,
  createSettingsAccountKey,
  createSipAccountId,
  resolveSettingsAccountKeyFromSipAccount,
} from "@domain/index.js";
import { createSipAccount } from "@domain/telephony/SipAccount.js";
import { InMemorySettingsRepository } from "./InMemorySettingsRepository.js";

function createTestSipAccount(
  username: string,
  domain: string,
  server: string,
) {
  return createSipAccount(createSipAccountId(username), {
    username,
    password: "secret",
    domain,
    server,
  });
}

describe("InMemorySettingsRepository", () => {
  it("persists multi-call settings via setMultiCallSettings", async () => {
    const repository = new InMemorySettingsRepository({
      multiCallSettings: {
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
      },
    });

    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: false,
    });

    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: false,
    });
  });

  it("normalizes autoUnholdOnTransferFailure when omitted", async () => {
    const repository = new InMemorySettingsRepository();

    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
    });

    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });

  it("stores per-account user settings aggregate", async () => {
    const repository = new InMemorySettingsRepository();
    const accountKey = createSettingsAccountKey("agent-42");
    const settings = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 7,
    };

    await repository.saveUserSettings(accountKey, settings);
    expect(await repository.getUserSettings(accountKey)).toEqual(settings);
  });

  it("persists language in per-account settings", async () => {
    const repository = new InMemorySettingsRepository();
    const accountKey = createSettingsAccountKey("agent-i18n");

    await repository.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      language: "en",
    });

    expect((await repository.getUserSettings(accountKey)).language).toBe("en");
  });

  it("exposes auto-answer timeout from active profile user settings", async () => {
    const repository = new InMemorySettingsRepository();
    const accountKey = createSettingsAccountKey("__anonymous__");
    await repository.setActiveProfileKey(accountKey);
    await repository.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      autoAnswerTimeoutSec: 12,
    });

    const incoming = await repository.getIncomingCallSettings();
    expect(incoming.autoAnswerTimeoutSec).toBe(12);
  });

  it("isolates settings buckets per account key", async () => {
    const repository = new InMemorySettingsRepository();
    const keyA = createSettingsAccountKey("1001@pbx-a.example");
    const keyB = createSettingsAccountKey("1002@pbx-b.example");

    await repository.saveUserSettings(keyA, {
      ...createDefaultUserSettings(),
      language: "en",
      multiSessionsEnabled: false,
    });
    await repository.saveUserSettings(keyB, {
      ...createDefaultUserSettings(),
      language: "ru",
      multiSessionsEnabled: true,
    });

    expect((await repository.getUserSettings(keyA)).language).toBe("en");
    expect((await repository.getUserSettings(keyB)).language).toBe("ru");
    expect((await repository.getUserSettings(keyA)).multiSessionsEnabled).toBe(false);
    expect((await repository.getUserSettings(keyB)).multiSessionsEnabled).toBe(true);
  });

  it("defaults active profile key from initial SIP account identity", async () => {
    const account = createTestSipAccount("1001", "pbx.example", "wss://pbx.example/ws");
    const repository = new InMemorySettingsRepository({ sipAccount: account });

    expect(await repository.getActiveProfileKey()).toBe(
      resolveSettingsAccountKeyFromSipAccount(account),
    );
  });

  it("switches active profile and exposes that account settings through aggregates", async () => {
    const repository = new InMemorySettingsRepository();
    const keyA = createSettingsAccountKey("1001@tenant.example");
    const keyB = createSettingsAccountKey("1002@tenant.example");

    await repository.saveUserSettings(keyA, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 5,
    });
    await repository.saveUserSettings(keyB, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: true,
      autoAnswerTimeoutSec: 20,
    });

    await repository.setActiveProfileKey(keyA);
    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect((await repository.getIncomingCallSettings()).autoAnswerTimeoutSec).toBe(5);

    await repository.setActiveProfileKey(keyB);
    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
    });
    expect((await repository.getIncomingCallSettings()).autoAnswerTimeoutSec).toBe(20);
  });

  it("does not update active aggregates when saving an inactive profile bucket", async () => {
    const repository = new InMemorySettingsRepository();
    const activeKey = createSettingsAccountKey("1001@tenant.example");
    const inactiveKey = createSettingsAccountKey("1002@tenant.example");

    await repository.setActiveProfileKey(activeKey);
    await repository.saveUserSettings(activeKey, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: true,
    });

    await repository.saveUserSettings(inactiveKey, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
    });

    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
    });
    expect((await repository.getUserSettings(inactiveKey)).multiSessionsEnabled).toBe(false);
  });

  it("lists known profile keys from persisted buckets", async () => {
    const repository = new InMemorySettingsRepository();
    const keyA = createSettingsAccountKey("1001@tenant.example");
    const keyB = createSettingsAccountKey("1002@tenant.example");

    await repository.saveUserSettings(keyA, createDefaultUserSettings());
    await repository.saveUserSettings(keyB, createDefaultUserSettings());

    expect(await repository.listKnownProfileKeys()).toEqual([
      createSettingsAccountKey("__anonymous__"),
      keyA,
      keyB,
    ]);
  });
});
