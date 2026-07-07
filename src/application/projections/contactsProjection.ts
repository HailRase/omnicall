import type { Contact, DomainEvent } from "@domain/index.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

export type ContactsLoadStatus = "idle" | "loading" | "populated" | "error";

export type ContactsProjection = Readonly<{
  status: ContactsLoadStatus;
  contacts: ReadonlyArray<Contact>;
  errorKey: string | null;
}>;

/**
 * - Purpose: project local contacts list state for renderer shell wiring.
 * - Inputs: previous projection, domain events, and explicit load snapshots.
 * - Outputs: immutable contacts projection with load status.
 */
export function initialContactsProjection(): ContactsProjection {
  return {
    status: "idle",
    contacts: [],
    errorKey: null,
  };
}

export function reduceContactsProjection(
  projection: ContactsProjection,
  event: DomainEvent,
): ContactsProjection {
  if (isSessionResetEvent(event)) {
    return initialContactsProjection();
  }

  if (event.type === "ContactCreated") {
    const contact = parseContactSnapshot(event);
    if (contact === null) {
      return projection;
    }

    const withoutDuplicate = projection.contacts.filter(
      (existing) => existing.id !== contact.id,
    );

    return {
      status: "populated",
      contacts: sortContacts([contact, ...withoutDuplicate]),
      errorKey: null,
    };
  }

  if (event.type === "ContactUpdated") {
    const contact = parseContactSnapshot(event);
    if (contact === null) {
      return projection;
    }

    const nextContacts = projection.contacts.map((existing) =>
      existing.id === contact.id ? contact : existing,
    );

    return {
      status: nextContacts.length > 0 ? "populated" : projection.status,
      contacts: sortContacts(nextContacts),
      errorKey: null,
    };
  }

  if (event.type === "ContactDeleted") {
    const contactId = asString(event["contactId"]);
    if (contactId === null) {
      return projection;
    }

    const nextContacts = projection.contacts.filter(
      (existing) => existing.id !== contactId,
    );

    return {
      status: nextContacts.length > 0 ? "populated" : "idle",
      contacts: nextContacts,
      errorKey: null,
    };
  }

  return projection;
}

export function applyContactsLoading(projection: ContactsProjection): ContactsProjection {
  return {
    ...projection,
    status: "loading",
    errorKey: null,
  };
}

export function applyContactsLoaded(
  _projection: ContactsProjection,
  contacts: ReadonlyArray<Contact>,
): ContactsProjection {
  return {
    status: contacts.length > 0 ? "populated" : "idle",
    contacts: sortContacts(contacts),
    errorKey: null,
  };
}

export function applyContactsLoadError(
  projection: ContactsProjection,
  errorKey: string,
): ContactsProjection {
  return {
    ...projection,
    status: "error",
    errorKey,
  };
}

function sortContacts(contacts: ReadonlyArray<Contact>): ReadonlyArray<Contact> {
  return [...contacts].sort((left, right) =>
    left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }),
  );
}

function parseContactSnapshot(event: DomainEvent): Contact | null {
  const contactId = asString(event["contactId"]);
  const displayName = asString(event["displayName"]);
  const primaryPhone = asString(event["primaryPhone"]);
  const secondaryPhone = asOptionalString(event["secondaryPhone"]);
  const company = asOptionalString(event["company"]);
  const notes = asOptionalString(event["notes"]);
  const createdAt = asString(event["createdAt"]);
  const updatedAt = asString(event["updatedAt"]);

  if (
    contactId === null ||
    displayName === null ||
    primaryPhone === null ||
    createdAt === null ||
    updatedAt === null
  ) {
    return null;
  }

  return {
    id: contactId as Contact["id"],
    displayName,
    primaryPhone,
    secondaryPhone,
    company,
    notes,
    createdAt,
    updatedAt,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
