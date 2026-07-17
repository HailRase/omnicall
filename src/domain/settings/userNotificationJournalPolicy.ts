import type {
  UserNotificationJournalEntry,
  UserNotificationTitleParam,
} from "./UserNotificationJournalEntry.js";

export const USER_NOTIFICATION_JOURNAL_RETENTION_MS = 24 * 60 * 60 * 1_000;
export const MAX_USER_NOTIFICATION_TITLE_LENGTH = 500;

const SECRET_VALUE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/giu,
  /\b(?:password|passwd|api[_ -]?key|authorization|token)\s*[:=]\s*[^\s,;]+/giu,
];

export function sanitizeUserNotificationText(value: string): string {
  let sanitized = value.trim();
  for (const pattern of SECRET_VALUE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized.slice(0, MAX_USER_NOTIFICATION_TITLE_LENGTH);
}

/**
 * Display-only local part of an account identity (`user@host` → `user`).
 * Keeps values without `@` unchanged.
 */
export function toUserNotificationAccountDisplayLabel(value: string): string {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, atIndex);
}

export function sanitizeUserNotificationTitleParams(
  params: Readonly<Record<string, UserNotificationTitleParam>>,
): Readonly<Record<string, UserNotificationTitleParam>> {
  const sanitized: Record<string, UserNotificationTitleParam> = {};
  for (const [key, value] of Object.entries(params)) {
    if (isSecretFieldName(key)) {
      continue;
    }
    sanitized[key] =
      typeof value === "string" ? sanitizeUserNotificationText(value) : value;
  }
  return sanitized;
}

export function retainUserNotificationJournalEntries(
  entries: ReadonlyArray<UserNotificationJournalEntry>,
  nowMs: number,
): ReadonlyArray<UserNotificationJournalEntry> {
  const cutoff = nowMs - USER_NOTIFICATION_JOURNAL_RETENTION_MS;
  return entries
    .filter((entry) => {
      const emittedAtMs = Date.parse(entry.emittedAt);
      return Number.isFinite(emittedAtMs) && emittedAtMs >= cutoff && emittedAtMs <= nowMs;
    })
    .sort((left, right) => Date.parse(right.emittedAt) - Date.parse(left.emittedAt));
}

function isSecretFieldName(value: string): boolean {
  const normalized = value.toLowerCase().replaceAll("-", "").replaceAll("_", "");
  return (
    normalized.includes("password") ||
    normalized.includes("passwd") ||
    normalized.includes("apikey") ||
    normalized.includes("authorization") ||
    normalized.includes("token") ||
    normalized.includes("secret")
  );
}
