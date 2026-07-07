import type { Contact, ContactId, ContactInput, ContactUpdateInput } from "@domain/index.js";

export interface ContactRepository {
  listContacts(): Promise<ReadonlyArray<Contact>>;
  getContactById(contactId: ContactId): Promise<Contact | null>;
  createContact(input: ContactInput): Promise<Contact>;
  updateContact(
    contactId: ContactId,
    input: ContactUpdateInput,
  ): Promise<Contact | null>;
  deleteContact(contactId: ContactId): Promise<boolean>;
}
