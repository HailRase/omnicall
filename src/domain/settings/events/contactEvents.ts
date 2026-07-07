import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { Contact } from "../Contact.js";

export type ContactCreatedEvent = ReturnType<typeof createContactCreatedEvent>;
export type ContactUpdatedEvent = ReturnType<typeof createContactUpdatedEvent>;
export type ContactDeletedEvent = ReturnType<typeof createContactDeletedEvent>;

/**
 * - Purpose: announce that a local contact was created.
 * - Inputs: full contact snapshot and correlation id.
 * - Outputs: ContactCreated domain event.
 */
export function createContactCreatedEvent(
  correlationId: CorrelationId,
  contact: Contact,
): ReturnType<
  typeof createDomainEvent<
    "ContactCreated",
    Readonly<{
      contactId: Contact["id"];
      displayName: string;
      primaryPhone: string;
      secondaryPhone: string | null;
      company: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >
> {
  return createDomainEvent("ContactCreated", correlationId, toContactPayload(contact));
}

/**
 * - Purpose: announce that a local contact was updated.
 * - Inputs: full contact snapshot and correlation id.
 * - Outputs: ContactUpdated domain event.
 */
export function createContactUpdatedEvent(
  correlationId: CorrelationId,
  contact: Contact,
): ReturnType<
  typeof createDomainEvent<
    "ContactUpdated",
    Readonly<{
      contactId: Contact["id"];
      displayName: string;
      primaryPhone: string;
      secondaryPhone: string | null;
      company: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >
> {
  return createDomainEvent("ContactUpdated", correlationId, toContactPayload(contact));
}

/**
 * - Purpose: announce that a local contact was deleted.
 * - Inputs: deleted contact id and correlation id.
 * - Outputs: ContactDeleted domain event.
 */
export function createContactDeletedEvent(
  correlationId: CorrelationId,
  contactId: Contact["id"],
): ReturnType<
  typeof createDomainEvent<
    "ContactDeleted",
    Readonly<{
      contactId: Contact["id"];
    }>
  >
> {
  return createDomainEvent("ContactDeleted", correlationId, { contactId });
}

function toContactPayload(contact: Contact): Readonly<{
  contactId: Contact["id"];
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}> {
  return {
    contactId: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    notes: contact.notes,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}
