import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createSettingsAccountKey,
  createUserNotificationJournalEntryId,
  USER_NOTIFICATION_JOURNAL_RETENTION_MS,
  type UserNotificationJournalEntry,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { FileUserNotificationJournalRepository } from "./FileUserNotificationJournalRepository.js";

const roots: string[] = [];
const NOW_MS = Date.parse("2026-07-17T10:00:00.000Z");

function createEntry(idValue: string, emittedAtMs: number): UserNotificationJournalEntry {
  const id = createUserNotificationJournalEntryId(idValue);
  if (id === null) {
    throw new Error("invalid test id");
  }
  return {
    id,
    emittedAt: new Date(emittedAtMs).toISOString(),
    accountKey: createSettingsAccountKey("agent@pbx.example"),
    accountDisplayLabel: "agent@pbx.example",
    level: "error",
    module: "account",
    functionId: "account.sign_in",
    titleKey: "account.error.authorizationFailed",
    titleParams: {},
    titleSnapshot: "Authorization failed",
    suppressedAtEmission: true,
    correlationId: "corr-1",
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("FileUserNotificationJournalRepository", () => {
  it("persists sanitized entries and prunes records older than rolling 24 hours", async () => {
    const root = await mkdtemp(join(tmpdir(), "omnicall-notification-journal-"));
    roots.push(root);
    const filesystem = new NodeFileSystemAdapter();
    const first = new FileUserNotificationJournalRepository({
      storageRoot: root,
      filesystem,
    });
    await first.appendEntry(
      createEntry("old", NOW_MS - USER_NOTIFICATION_JOURNAL_RETENTION_MS - 1),
      NOW_MS,
    );
    await first.appendEntry(createEntry("current", NOW_MS), NOW_MS);

    const second = new FileUserNotificationJournalRepository({
      storageRoot: root,
      filesystem,
    });
    const entries = await second.listEntries(NOW_MS);

    expect(entries.map((entry) => entry.id)).toEqual(["current"]);
    expect(entries[0]?.suppressedAtEmission).toBe(true);
  });
});
