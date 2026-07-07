import { createContact, updateContact, type Contact, type ContactId, type ContactInput, type ContactUpdateInput } from "@domain/index.js";
import type { ContactRepository } from "@ports/settings/ContactRepository.js";

/**
 * - Purpose: in-memory local contact store for tests and mock bootstrap.
 * - Inputs: CRUD operations on Contact records.
 * - Outputs: ContactRepository with sorted list semantics.
 */
export class InMemoryContactRepository implements ContactRepository {
  private readonly contacts = new Map<ContactId, Contact>();

  listContacts(): Promise<ReadonlyArray<Contact>> {
    const sorted = [...this.contacts.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }),
    );
    return Promise.resolve(sorted);
  }

  getContactById(contactId: ContactId): Promise<Contact | null> {
    return Promise.resolve(this.contacts.get(contactId) ?? null);
  }

  createContact(input: ContactInput): Promise<Contact> {
    const created = createContact(input);
    if (!created.ok) {
      throw new Error(`contact_validation_failed:${created.errors.join(",")}`);
    }

    this.contacts.set(created.value.id, created.value);
    return Promise.resolve(created.value);
  }

  async updateContact(
    contactId: ContactId,
    input: ContactUpdateInput,
  ): Promise<Contact | null> {
    const existing = await this.getContactById(contactId);
    if (existing === null) {
      return null;
    }

    const updated = updateContact(existing, input);
    if (!updated.ok) {
      throw new Error(`contact_validation_failed:${updated.errors.join(",")}`);
    }

    this.contacts.set(contactId, updated.value);
    return updated.value;
  }

  deleteContact(contactId: ContactId): Promise<boolean> {
    return Promise.resolve(this.contacts.delete(contactId));
  }

  /** Replaces all contacts — used when hydrating from disk parse result. */
  replaceContacts(contacts: ReadonlyArray<Contact>): void {
    this.contacts.clear();
    for (const contact of contacts) {
      this.contacts.set(contact.id, contact);
    }
  }
}
