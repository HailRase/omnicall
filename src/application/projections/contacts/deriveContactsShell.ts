import type { Contact } from "@domain/index.js";
import type { ContactsProjection } from "./contactsProjection.js";
import type { MultiCallProjection } from "../telephony/multiCallProjection.js";

export type ContactCallDisabledReasonKey =
  | "contacts.call.disabled.notRegistered"
  | "contacts.call.disabled.activeCallPolicy";

export type ContactsMessageKey =
  | ContactCallDisabledReasonKey
  | "contacts.error.loadFailed";

export type ContactShellViewModel = Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
  callDisabledReasonKey: ContactCallDisabledReasonKey | null;
}>;

export type ContactsShellViewModel = Readonly<{
  status: ContactsProjection["status"];
  contacts: ReadonlyArray<ContactShellViewModel>;
  errorKey: "contacts.error.loadFailed" | null;
  isEmpty: boolean;
}>;

/**
 * - Purpose: map contacts projection into renderer shell view-model fields.
 * - Inputs: contacts projection, registration flag, and multi-call guards.
 * - Outputs: shell view-model with per-row call disabled reasons.
 */
export function deriveContactsShell(input: Readonly<{
  projection: ContactsProjection;
  isSipRegistered: boolean;
  multiCallProjection: MultiCallProjection;
}>): ContactsShellViewModel {
  const globalCallReason = resolveGlobalCallDisabledReason(
    input.isSipRegistered,
    input.multiCallProjection,
  );

  const contacts = input.projection.contacts.map((contact) =>
    mapContact(contact, globalCallReason),
  );

  return {
    status: input.projection.status,
    contacts,
    errorKey: toContactsErrorKey(input.projection.errorKey),
    isEmpty: input.projection.status !== "loading" && contacts.length === 0,
  };
}

function toContactsErrorKey(errorKey: string | null): "contacts.error.loadFailed" | null {
  if (errorKey === "contacts.error.loadFailed") {
    return errorKey;
  }
  return null;
}

function mapContact(
  contact: Contact,
  globalCallReason: ContactCallDisabledReasonKey | null,
): ContactShellViewModel {
  return {
    id: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    notes: contact.notes,
    callDisabledReasonKey: globalCallReason,
  };
}

function resolveGlobalCallDisabledReason(
  isSipRegistered: boolean,
  multiCallProjection: MultiCallProjection,
): ContactCallDisabledReasonKey | null {
  if (!isSipRegistered) {
    return "contacts.call.disabled.notRegistered";
  }

  if (
    multiCallProjection.hasEstablishedCall &&
    !multiCallProjection.multiSessionsEnabled
  ) {
    return "contacts.call.disabled.activeCallPolicy";
  }

  return null;
}
