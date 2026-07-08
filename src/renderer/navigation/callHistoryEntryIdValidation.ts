/**
 * - Purpose: validate call history route param strings before shell navigation resolves detail route.
 * - Inputs: raw route param from the router.
 * - Outputs: trimmed entry id or null when invalid.
 */
const CALL_HISTORY_ENTRY_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function parseCallHistoryEntryId(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || !CALL_HISTORY_ENTRY_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}
