import { createSettingsAccountKey } from "./SettingsAccountKey.js";
import {
  USER_NOTIFICATION_LEVELS,
  USER_NOTIFICATION_MODULES,
  createUserNotificationJournalEntryId,
  type UserNotificationJournalEntry,
  type UserNotificationLevel,
  type UserNotificationModule,
  type UserNotificationTitleParam,
} from "./UserNotificationJournalEntry.js";
import { hasForbiddenSecretField } from "./persistedCallHistoryReaders.js";
import { retainUserNotificationJournalEntries } from "./userNotificationJournalPolicy.js";

export const USER_NOTIFICATION_JOURNAL_SCHEMA_VERSION = 1 as const;

export type UserNotificationJournalDocument = Readonly<{
  schemaVersion: typeof USER_NOTIFICATION_JOURNAL_SCHEMA_VERSION;
  entries: ReadonlyArray<UserNotificationJournalEntry>;
}>;

export type UserNotificationJournalParseErrorCode =
  | "invalid_shape"
  | "unsupported_schema_version"
  | "forbidden_secret_field";

export type UserNotificationJournalParseResult =
  | Readonly<{ ok: true; value: UserNotificationJournalDocument }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: UserNotificationJournalParseErrorCode }>;
    }>;

export function serializeUserNotificationJournalDocument(
  entries: ReadonlyArray<UserNotificationJournalEntry>,
  nowMs: number = Date.now(),
): string {
  const document: UserNotificationJournalDocument = {
    schemaVersion: USER_NOTIFICATION_JOURNAL_SCHEMA_VERSION,
    entries: retainUserNotificationJournalEntries(entries, nowMs),
  };
  if (hasForbiddenSecretField(document)) {
    throw new Error("user_notification_journal_contains_forbidden_secret_field");
  }
  return JSON.stringify(document);
}

export function parsePersistedUserNotificationJournalDocument(
  raw: unknown,
  nowMs: number = Date.now(),
): UserNotificationJournalParseResult {
  if (hasForbiddenSecretField(raw)) {
    return { ok: false, error: { code: "forbidden_secret_field" } };
  }
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { code: "invalid_shape" } };
  }
  const record = raw as Record<string, unknown>;
  if (record["schemaVersion"] !== USER_NOTIFICATION_JOURNAL_SCHEMA_VERSION) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }
  const rawEntries = record["entries"];
  if (!Array.isArray(rawEntries)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }
  const entries = rawEntries
    .map(parseEntry)
    .filter((entry): entry is UserNotificationJournalEntry => entry !== null);
  return {
    ok: true,
    value: {
      schemaVersion: USER_NOTIFICATION_JOURNAL_SCHEMA_VERSION,
      entries: retainUserNotificationJournalEntries(entries, nowMs),
    },
  };
}

function parseEntry(raw: unknown): UserNotificationJournalEntry | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const idRaw = readString(record, "id");
  const id = idRaw === null ? null : createUserNotificationJournalEntryId(idRaw);
  const emittedAt = readString(record, "emittedAt");
  const accountKey = readString(record, "accountKey");
  const accountDisplayLabel = readString(record, "accountDisplayLabel");
  const level = readLevel(record["level"]);
  const module = readModule(record["module"]);
  const functionId = readString(record, "functionId");
  const titleKeyValue = record["titleKey"];
  const titleKey =
    titleKeyValue === null || typeof titleKeyValue === "string" ? titleKeyValue : undefined;
  const titleSnapshot = readString(record, "titleSnapshot");
  const suppressedAtEmission = record["suppressedAtEmission"];
  const correlationIdValue = record["correlationId"];
  const correlationId =
    correlationIdValue === null || typeof correlationIdValue === "string"
      ? correlationIdValue
      : undefined;
  const titleParams = readTitleParams(record["titleParams"]);
  if (
    id === null ||
    emittedAt === null ||
    !Number.isFinite(Date.parse(emittedAt)) ||
    accountKey === null ||
    accountDisplayLabel === null ||
    level === null ||
    module === null ||
    functionId === null ||
    titleKey === undefined ||
    titleSnapshot === null ||
    typeof suppressedAtEmission !== "boolean" ||
    correlationId === undefined ||
    titleParams === null
  ) {
    return null;
  }
  return {
    id,
    emittedAt,
    accountKey: createSettingsAccountKey(accountKey),
    accountDisplayLabel,
    level,
    module,
    functionId,
    titleKey,
    titleParams,
    titleSnapshot,
    suppressedAtEmission,
    correlationId,
  };
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readLevel(value: unknown): UserNotificationLevel | null {
  return typeof value === "string" &&
    (USER_NOTIFICATION_LEVELS as ReadonlyArray<string>).includes(value)
    ? (value as UserNotificationLevel)
    : null;
}

function readModule(value: unknown): UserNotificationModule | null {
  return typeof value === "string" &&
    (USER_NOTIFICATION_MODULES as ReadonlyArray<string>).includes(value)
    ? (value as UserNotificationModule)
    : null;
}

function readTitleParams(
  value: unknown,
): Readonly<Record<string, UserNotificationTitleParam>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const result: Record<string, UserNotificationTitleParam> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string" && typeof entry !== "number") {
      return null;
    }
    result[key] = entry;
  }
  return result;
}
