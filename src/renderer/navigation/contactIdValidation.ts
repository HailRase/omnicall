/**
 * - Purpose: validate contact route param strings before shell navigation resolves a contact route.
 * - Inputs: raw route param from the router.
 * - Outputs: trimmed contact id or null when invalid.
 */
const CONTACT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function parseContactId(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || !CONTACT_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}
