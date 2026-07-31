import {
  createSettingsAccountKey,
  type SettingsAccountKey,
} from "@domain/index.js";

export const PROFILES_DIRECTORY_NAME = "profiles";
export const SETTINGS_DIRECTORY_NAME = "settings";
export const CONTACTS_DIRECTORY_NAME = "contacts";
export const CALL_HISTORY_DIRECTORY_NAME = "call-history";
export const EXTERNAL_SERVICES_JOURNAL_DIRECTORY_NAME = "external-services-journal";
export const PROFILES_INDEX_FILE_NAME = "index.json";
export const SAVED_ACCOUNT_PROFILES_FILE_NAME = "saved-accounts.json";
export const USER_NOTIFICATION_JOURNAL_FILE_NAME = "notification-journal.json";
/** Machine-common Origin trust + matrix (ADR-0018 §C.4 / DI-11). */
export const SDK_ORIGIN_TRUST_FILE_NAME = "sdk-origin-trust.json";

function joinStoragePath(...segments: ReadonlyArray<string>): string {
  return segments
    .map((segment) => segment.replace(/\\/g, "/").replace(/\/+$/u, ""))
    .filter((segment) => segment.length > 0)
    .join("/");
}

const utf8TextEncoder = new TextEncoder();
const utf8TextDecoder = new TextDecoder();

function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(utf8TextEncoder.encode(text));
}

function base64UrlToUtf8(encoded: string): string {
  return utf8TextDecoder.decode(base64UrlToBytes(encoded));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${"=".repeat(paddingLength)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * - Purpose: encode profile key into a cross-platform settings filename segment.
 * - Inputs: branded SettingsAccountKey (may contain @ or |).
 * - Outputs: base64url filename token without extension.
 */
export function encodeProfileKeyForFileName(accountKey: SettingsAccountKey): string {
  return utf8ToBase64Url(accountKey);
}

/**
 * - Purpose: decode settings filename token back to profile key.
 * - Inputs: base64url filename token.
 * - Outputs: branded SettingsAccountKey or null when token is invalid.
 */
export function decodeProfileKeyFromFileName(encoded: string): SettingsAccountKey | null {
  if (encoded.length === 0) {
    return null;
  }

  try {
    const decoded = base64UrlToUtf8(encoded);
    if (decoded.length === 0) {
      return null;
    }
    return createSettingsAccountKey(decoded);
  } catch {
    return null;
  }
}

/**
 * - Purpose: resolve profiles root directory under injected storage root.
 * - Inputs: storage root absolute path.
 * - Outputs: profiles directory absolute path.
 */
export function resolveProfilesRootPath(storageRoot: string): string {
  return joinStoragePath(storageRoot, PROFILES_DIRECTORY_NAME);
}

/**
 * - Purpose: resolve persisted active-profile index file path.
 * - Inputs: storage root absolute path.
 * - Outputs: index.json absolute path.
 */
export function resolveProfilesIndexPath(storageRoot: string): string {
  return joinStoragePath(resolveProfilesRootPath(storageRoot), PROFILES_INDEX_FILE_NAME);
}

/**
 * - Purpose: resolve persisted saved SIP account profiles document path.
 * - Inputs: storage root absolute path.
 * - Outputs: saved-accounts.json absolute path under profiles directory.
 */
export function resolveSavedAccountProfilesFilePath(storageRoot: string): string {
  return joinStoragePath(
    resolveProfilesRootPath(storageRoot),
    SAVED_ACCOUNT_PROFILES_FILE_NAME,
  );
}

/**
 * - Purpose: resolve machine-common SDK Origin trust document path.
 * - Inputs: storage root absolute path.
 * - Outputs: sdk-origin-trust.json under profiles directory (not per-SIP silo).
 */
export function resolveSdkOriginTrustFilePath(storageRoot: string): string {
  return joinStoragePath(
    resolveProfilesRootPath(storageRoot),
    SDK_ORIGIN_TRUST_FILE_NAME,
  );
}

export function resolveUserNotificationJournalFilePath(storageRoot: string): string {
  return joinStoragePath(
    resolveProfilesRootPath(storageRoot),
    USER_NOTIFICATION_JOURNAL_FILE_NAME,
  );
}

/**
 * - Purpose: resolve per-profile settings directory path.
 * - Inputs: storage root absolute path.
 * - Outputs: settings directory absolute path.
 */
export function resolveProfileSettingsDirectoryPath(storageRoot: string): string {
  return joinStoragePath(resolveProfilesRootPath(storageRoot), SETTINGS_DIRECTORY_NAME);
}

/**
 * - Purpose: resolve on-disk UserSettings file for one profile key.
 * - Inputs: storage root and profile key.
 * - Outputs: settings JSON file absolute path.
 */
export function resolveProfileSettingsFilePath(
  storageRoot: string,
  accountKey: SettingsAccountKey,
): string {
  const encodedKey = encodeProfileKeyForFileName(accountKey);
  return joinStoragePath(resolveProfileSettingsDirectoryPath(storageRoot), `${encodedKey}.json`);
}

/**
 * - Purpose: resolve per-profile contacts directory path.
 * - Inputs: storage root absolute path.
 * - Outputs: contacts directory absolute path.
 */
export function resolveProfileContactsDirectoryPath(storageRoot: string): string {
  return joinStoragePath(resolveProfilesRootPath(storageRoot), CONTACTS_DIRECTORY_NAME);
}

/**
 * - Purpose: resolve on-disk contacts file for one profile key.
 * - Inputs: storage root and profile key.
 * - Outputs: contacts JSON file absolute path.
 */
export function resolveProfileContactsFilePath(
  storageRoot: string,
  accountKey: SettingsAccountKey,
): string {
  const encodedKey = encodeProfileKeyForFileName(accountKey);
  return joinStoragePath(resolveProfileContactsDirectoryPath(storageRoot), `${encodedKey}.json`);
}

/**
 * - Purpose: resolve per-profile call history directory path.
 * - Inputs: storage root absolute path.
 * - Outputs: call-history directory absolute path.
 */
export function resolveProfileCallHistoryDirectoryPath(storageRoot: string): string {
  return joinStoragePath(resolveProfilesRootPath(storageRoot), CALL_HISTORY_DIRECTORY_NAME);
}

/**
 * - Purpose: resolve on-disk call history file for one profile key.
 * - Inputs: storage root and profile key.
 * - Outputs: call-history JSON file absolute path.
 */
export function resolveProfileCallHistoryFilePath(
  storageRoot: string,
  accountKey: SettingsAccountKey,
): string {
  const encodedKey = encodeProfileKeyForFileName(accountKey);
  return joinStoragePath(
    resolveProfileCallHistoryDirectoryPath(storageRoot),
    `${encodedKey}.json`,
  );
}

/**
 * - Purpose: resolve per-profile External Services journal directory path.
 * - Inputs: storage root absolute path.
 * - Outputs: external-services-journal directory absolute path.
 */
export function resolveExternalServicesJournalDirectoryPath(
  storageRoot: string,
): string {
  return joinStoragePath(
    resolveProfilesRootPath(storageRoot),
    EXTERNAL_SERVICES_JOURNAL_DIRECTORY_NAME,
  );
}

/**
 * - Purpose: resolve on-disk External Services journal file for one profile key.
 * - Inputs: storage root and profile key.
 * - Outputs: journal JSON file absolute path.
 */
export function resolveExternalServicesJournalFilePath(
  storageRoot: string,
  accountKey: SettingsAccountKey,
): string {
  const encodedKey = encodeProfileKeyForFileName(accountKey);
  return joinStoragePath(
    resolveExternalServicesJournalDirectoryPath(storageRoot),
    `${encodedKey}.json`,
  );
}
