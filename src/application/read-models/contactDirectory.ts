import type { Contact, ContactId } from "@domain/index.js";
import { normalizePhoneNumber } from "@domain/index.js";

export type CallerPresentationSource = "contact" | "sip" | "number" | "unknown";

export type CallerPresentation = Readonly<{
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: ContactId | null;
  source: CallerPresentationSource;
}>;

export type ContactDirectory = Readonly<{
  resolvePresentation: (
    input: ResolveCallerPresentationInput,
  ) => CallerPresentation;
}>;

export type ResolveCallerPresentationInput = Readonly<{
  remoteNumber: string;
  displayLabel: string | null;
}>;

type IndexedContactMatch = Readonly<{
  contactId: ContactId;
  displayName: string;
  priority: 2 | 1;
}>;

/**
 * - Purpose: build a normalized phone lookup index for caller identity enrichment.
 * - Inputs: loaded contacts for the active account profile.
 * - Outputs: ContactDirectory that resolves caller presentation without mutating history.
 */
export function buildContactDirectory(
  contacts: ReadonlyArray<Contact>,
): ContactDirectory {
  const index = buildPhoneIndex(contacts);

  return {
    resolvePresentation: (input) => resolveCallerPresentation(index, input),
  };
}

/**
 * - Purpose: resolve caller labels for history and active-call projections.
 * - Inputs: phone index and raw remote number plus optional SIP/display label snapshot.
 * - Outputs: CallerPresentation with contact-first priority and number as secondary label.
 */
export function resolveCallerPresentation(
  index: ReadonlyMap<string, IndexedContactMatch>,
  input: ResolveCallerPresentationInput,
): CallerPresentation {
  const normalizedNumber = normalizeLookupPhone(input.remoteNumber);
  const contactMatch =
    normalizedNumber.length > 0 ? index.get(normalizedNumber) ?? null : null;

  if (contactMatch !== null) {
    return {
      primaryLabel: contactMatch.displayName,
      secondaryLabel: presentableNumber(input.remoteNumber, normalizedNumber),
      contactId: contactMatch.contactId,
      source: "contact",
    };
  }

  const sipLabel = resolveSipDisplayLabel(input.displayLabel, normalizedNumber);
  if (sipLabel !== null) {
    return {
      primaryLabel: sipLabel,
      secondaryLabel: presentableNumber(input.remoteNumber, normalizedNumber),
      contactId: null,
      source: "sip",
    };
  }

  if (normalizedNumber.length > 0) {
    return {
      primaryLabel: normalizedNumber,
      secondaryLabel: null,
      contactId: null,
      source: "number",
    };
  }

  return {
    primaryLabel: "",
    secondaryLabel: null,
    contactId: null,
    source: "unknown",
  };
}

function buildPhoneIndex(
  contacts: ReadonlyArray<Contact>,
): ReadonlyMap<string, IndexedContactMatch> {
  const index = new Map<string, IndexedContactMatch>();

  for (const contact of contacts) {
    registerPhone(index, contact.primaryPhone, contact, 2);
    if (contact.secondaryPhone !== null) {
      registerPhone(index, contact.secondaryPhone, contact, 1);
    }
  }

  return index;
}

function registerPhone(
  index: Map<string, IndexedContactMatch>,
  phone: string,
  contact: Contact,
  priority: IndexedContactMatch["priority"],
): void {
  const normalized = normalizeLookupPhone(phone);
  if (normalized.length === 0) {
    return;
  }

  const candidate: IndexedContactMatch = {
    contactId: contact.id,
    displayName: contact.displayName,
    priority,
  };

  const existing = index.get(normalized);
  if (existing === undefined || isPreferredMatch(candidate, existing)) {
    index.set(normalized, candidate);
  }
}

function isPreferredMatch(
  candidate: IndexedContactMatch,
  existing: IndexedContactMatch,
): boolean {
  if (candidate.priority !== existing.priority) {
    return candidate.priority > existing.priority;
  }

  return candidate.contactId.localeCompare(existing.contactId) < 0;
}

function resolveSipDisplayLabel(
  displayLabel: string | null,
  normalizedNumber: string,
): string | null {
  const trimmed = displayLabel?.trim() ?? "";
  if (trimmed.length === 0) {
    return null;
  }

  if (normalizedNumber.length > 0 && normalizeLookupPhone(trimmed) === normalizedNumber) {
    return null;
  }

  return trimmed;
}

function presentableNumber(
  remoteNumber: string,
  normalizedNumber: string,
): string | null {
  if (normalizedNumber.length > 0) {
    return normalizedNumber;
  }

  const trimmed = remoteNumber.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * - Purpose: resolve primary call-line label from contacts and SIP snapshot.
 * - Inputs: contact directory, remote number, optional display label.
 * - Outputs: display name string or unknown-label i18n key fallback.
 */
export function resolveCallLineDisplayName(
  contactDirectory: ContactDirectory,
  remoteNumber: string | null,
  displayLabel: string | null,
): string {
  const presentation = contactDirectory.resolvePresentation({
    remoteNumber: remoteNumber ?? "",
    displayLabel,
  });

  return presentation.primaryLabel.length > 0
    ? presentation.primaryLabel
    : "call.line.display.unknown";
}

function normalizeLookupPhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  return normalizePhoneNumber(trimmed);
}
