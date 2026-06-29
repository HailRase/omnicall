/**
 * - Purpose: map DTMF operation errors to operator-facing Russian copy.
 * - Inputs: raw projection error string or null.
 * - Outputs: localized user message or null when no error.
 */
export function mapDtmfErrorMessage(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }

  const normalized = raw.toLowerCase();
  if (normalized.includes("session not found")) {
    return "Звонок недоступен для тонового набора";
  }
  if (normalized.includes("invalid_state")) {
    return "Тоновый набор недоступен в текущем состоянии звонка";
  }
  if (normalized.includes("not implemented")) {
    return "Тоновый набор временно недоступен";
  }

  return "Не удалось отправить тон";
}
