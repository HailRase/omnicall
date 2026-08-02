import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "./SettingsAccountKey.js";
import {
  USER_NOTIFICATION_MODULES,
  createUserNotificationJournalEntryId,
  type UserNotificationJournalEntry,
  type UserNotificationModule,
} from "./UserNotificationJournalEntry.js";
import {
  retainUserNotificationJournalEntries,
  sanitizeUserNotificationText,
  sanitizeUserNotificationTitleParams,
  toUserNotificationAccountDisplayLabel,
  USER_NOTIFICATION_JOURNAL_RETENTION_MS,
} from "./userNotificationJournalPolicy.js";
import {
  parsePersistedUserNotificationJournalDocument,
  serializeUserNotificationJournalDocument,
} from "./persistedUserNotificationJournal.js";

const NOW_MS = Date.parse("2026-07-17T09:00:00.000Z");

function entry(
  idValue: string,
  emittedAtMs: number,
  module: UserNotificationModule = "account",
): UserNotificationJournalEntry {
  const id = createUserNotificationJournalEntryId(idValue);
  if (id === null) {
    throw new Error("test notification id is invalid");
  }
  return {
    id,
    emittedAt: new Date(emittedAtMs).toISOString(),
    accountKey: createSettingsAccountKey("agent@pbx.example"),
    accountDisplayLabel: "agent@pbx.example",
    level: "error",
    module,
    functionId: `${module}.event`,
    titleKey: "account.error.authorizationFailed",
    titleParams: {},
    titleSnapshot: "Authorization failed",
    suppressedAtEmission: false,
    correlationId: "corr-1",
  };
}

describe("user notification journal policy", () => {
  it("keeps only the local part before @ for display labels", () => {
    expect(toUserNotificationAccountDisplayLabel("agent@pbx.example")).toBe("agent");
    expect(
      toUserNotificationAccountDisplayLabel("1001@tenant.example|edge.sbc"),
    ).toBe("1001");
    expect(toUserNotificationAccountDisplayLabel("agent")).toBe("agent");
    expect(toUserNotificationAccountDisplayLabel("  agent@host  ")).toBe("agent");
  });

  it("redacts secret-like values and drops secret parameter fields", () => {
    expect(sanitizeUserNotificationText("Authorization: Bearer abc.secret")).toBe(
      "[REDACTED]",
    );
    expect(
      sanitizeUserNotificationTitleParams({
        username: "agent",
        apiKey: "secret",
        attempt: 2,
      }),
    ).toEqual({ username: "agent", attempt: 2 });
  });

  it("retains only rolling 24 hour entries newest-first", () => {
    const retained = retainUserNotificationJournalEntries(
      [
        entry("old", NOW_MS - USER_NOTIFICATION_JOURNAL_RETENTION_MS - 1),
        entry("newer", NOW_MS - 1_000),
        entry("newest", NOW_MS),
      ],
      NOW_MS,
    );
    expect(retained.map((value) => value.id)).toEqual(["newest", "newer"]);
  });

  it("round-trips sanitized persisted entries", () => {
    const json = serializeUserNotificationJournalDocument([entry("n-1", NOW_MS)], NOW_MS);
    const parsed = parsePersistedUserNotificationJournalDocument(
      JSON.parse(json) as unknown,
      NOW_MS,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.entries).toHaveLength(1);
    }
  });

  it("round-trips expanded module catalog beside legacy modules", () => {
    const entries = USER_NOTIFICATION_MODULES.map((module, index) =>
      entry(`n-${module}`, NOW_MS - index, module),
    );
    const json = serializeUserNotificationJournalDocument(entries, NOW_MS);
    const parsed = parsePersistedUserNotificationJournalDocument(
      JSON.parse(json) as unknown,
      NOW_MS,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.entries.map((value) => value.module).sort()).toEqual(
      [...USER_NOTIFICATION_MODULES].sort(),
    );
  });

  it("rejects documents with secret field names", () => {
    const parsed = parsePersistedUserNotificationJournalDocument(
      {
        schemaVersion: 1,
        entries: [{ password: "secret" }],
      },
      NOW_MS,
    );
    expect(parsed).toEqual({
      ok: false,
      error: { code: "forbidden_secret_field" },
    });
  });
});
