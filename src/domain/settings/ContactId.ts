/**
 * - Purpose: stable identifier for persisted local contacts.
 * - Inputs: non-empty id string matching shell route param rules.
 * - Outputs: branded ContactId value or null when invalid.
 */
export type ContactId = string & { readonly __brand: "ContactId" };

const CONTACT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createContactId(value: string): ContactId | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || !CONTACT_ID_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed as ContactId;
}

/**
 * - Purpose: generate a new contact id for create flows.
 * - Inputs: none.
 * - Outputs: branded ContactId matching route validation pattern.
 */
export function generateContactId(): ContactId {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `contact_${timePart}_${randomPart}` as ContactId;
}
