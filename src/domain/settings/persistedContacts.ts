import { createContact, type Contact } from "./Contact.js";
import { createContactId } from "./ContactId.js";

export const CONTACTS_DOCUMENT_SCHEMA_VERSION = 1 as const;

export type ContactsDocumentV1 = Readonly<{
  schemaVersion: typeof CONTACTS_DOCUMENT_SCHEMA_VERSION;
  contacts: ReadonlyArray<Contact>;
}>;

export type ContactsDocumentParseErrorCode =
  | "invalid_shape"
  | "unsupported_schema_version"
  | "forbidden_secret_field";

export type ContactsDocumentParseResult =
  | { readonly ok: true; readonly value: ContactsDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{ readonly code: ContactsDocumentParseErrorCode }>;
    };

type PersistedContactRecordV1 = Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;

type PersistedContactsDocumentV1 = Readonly<{
  schemaVersion: typeof CONTACTS_DOCUMENT_SCHEMA_VERSION;
  contacts: ReadonlyArray<PersistedContactRecordV1>;
}>;

/**
 * - Purpose: serialize per-account contacts document for atomic persistence.
 * - Inputs: validated Contact list.
 * - Outputs: JSON string without secret-like field names.
 */
export function serializeContactsDocument(contacts: ReadonlyArray<Contact>): string {
  const document: PersistedContactsDocumentV1 = {
    schemaVersion: CONTACTS_DOCUMENT_SCHEMA_VERSION,
    contacts: contacts.map(toPersistedContactRecord),
  };

  return JSON.stringify(document);
}

/**
 * - Purpose: parse unknown JSON into contacts document with conservative validation.
 * - Inputs: parsed JSON value from contacts store file.
 * - Outputs: validated document or classified parse error.
 */
export function parsePersistedContactsDocument(raw: unknown): ContactsDocumentParseResult {
  if (hasForbiddenSecretField(raw)) {
    return { ok: false, error: { code: "forbidden_secret_field" } };
  }

  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const record = raw as Record<string, unknown>;
  const schemaVersion = record["schemaVersion"];

  if (schemaVersion !== CONTACTS_DOCUMENT_SCHEMA_VERSION) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const contactsRaw = record["contacts"];
  if (!Array.isArray(contactsRaw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const contacts: Contact[] = [];

  for (const entry of contactsRaw) {
    const parsedContact = parsePersistedContactEntry(entry);
    if (parsedContact === null) {
      continue;
    }

    if (contacts.some((existing) => existing.id === parsedContact.id)) {
      continue;
    }

    contacts.push(parsedContact);
  }

  contacts.sort((left, right) =>
    left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }),
  );

  return {
    ok: true,
    value: {
      schemaVersion: CONTACTS_DOCUMENT_SCHEMA_VERSION,
      contacts,
    },
  };
}

function parsePersistedContactEntry(raw: unknown): Contact | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const idRaw = readRequiredString(record, "id");
  const displayName = readRequiredString(record, "displayName");
  const primaryPhone = readRequiredString(record, "primaryPhone");
  const createdAt = readRequiredString(record, "createdAt");
  const updatedAt = readRequiredString(record, "updatedAt");

  if (
    idRaw === null ||
    displayName === null ||
    primaryPhone === null ||
    createdAt === null ||
    updatedAt === null
  ) {
    return null;
  }

  const contactId = createContactId(idRaw);
  if (contactId === null) {
    return null;
  }

  const created = createContact(
    {
      displayName,
      primaryPhone,
      secondaryPhone: readNullableOrMissingString(record, "secondaryPhone") ?? "",
      company: readNullableOrMissingString(record, "company") ?? "",
      notes: readNullableOrMissingString(record, "notes") ?? "",
    },
    {
      id: contactId,
      createdAt,
      updatedAt,
    },
  );

  if (!created.ok) {
    return null;
  }

  return created.value;
}

function toPersistedContactRecord(contact: Contact): PersistedContactRecordV1 {
  return {
    id: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    notes: contact.notes,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

function readRequiredString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

function readNullableOrMissingString(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
}

const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

function hasForbiddenSecretField(value: unknown): boolean {
  try {
    scanValueForForbiddenSecretFields(value, []);
    return false;
  } catch {
    return true;
  }
}

function scanValueForForbiddenSecretFields(
  value: unknown,
  path: ReadonlyArray<string>,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      scanValueForForbiddenSecretFields(entry, [...path, String(index)]);
    });
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [fieldName, nestedValue] of Object.entries(value)) {
    if (isForbiddenSecretFieldName(fieldName)) {
      throw new Error(`forbidden_secret_field:${fieldName}`);
    }
    scanValueForForbiddenSecretFields(nestedValue, [...path, fieldName]);
  }
}

function isForbiddenSecretFieldName(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return FORBIDDEN_SECRET_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}
