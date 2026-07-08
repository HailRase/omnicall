import { describe, expect, it } from "vitest";
import { createContact } from "./Contact.js";
import {
  CONTACTS_DOCUMENT_SCHEMA_VERSION,
  parsePersistedContactsDocument,
  serializeContactsDocument,
} from "./persistedContacts.js";

describe("parsePersistedContactsDocument", () => {
  it("round-trips valid contacts through serialize and parse", () => {
    const created = createContact({
      displayName: "Alex Agent",
      primaryPhone: "+12025550100",
      secondaryPhone: "+12025550101",
      company: "Acme",
      notes: "VIP",
    });
    if (!created.ok) {
      throw new Error("expected valid contact");
    }

    const json = serializeContactsDocument([created.value]);
    const parsed = parsePersistedContactsDocument(JSON.parse(json) as unknown);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.schemaVersion).toBe(CONTACTS_DOCUMENT_SCHEMA_VERSION);
    expect(parsed.value.contacts).toHaveLength(1);
    expect(parsed.value.contacts[0]).toEqual(created.value);
  });

  it("rejects unsupported schema version", () => {
    const result = parsePersistedContactsDocument({
      schemaVersion: 99,
      contacts: [],
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "unsupported_schema_version" },
    });
  });

  it("skips invalid contact records conservatively", () => {
    const valid = createContact({
      displayName: "Valid Contact",
      primaryPhone: "+12025550100",
    });
    if (!valid.ok) {
      throw new Error("expected valid contact");
    }

    const result = parsePersistedContactsDocument({
      schemaVersion: CONTACTS_DOCUMENT_SCHEMA_VERSION,
      contacts: [
        { id: "bad", displayName: "", primaryPhone: "x" },
        valid.value,
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.contacts).toHaveLength(1);
    expect(result.value.contacts[0]?.displayName).toBe("Valid Contact");
  });

  it("rejects documents with forbidden secret field names", () => {
    const result = parsePersistedContactsDocument({
      schemaVersion: CONTACTS_DOCUMENT_SCHEMA_VERSION,
      contacts: [],
      password: "secret",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "forbidden_secret_field" },
    });
  });
});
