/**
 * - Purpose: map operator status projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from operator status controls projection.
 * - Outputs: localized label string or null when key is not operator-status-related.
 */
export function mapOperatorStatusDisabledReason(reason: string): string | null {
  switch (reason) {
    case "ocp_not_connected":
      return "Платформа оператора недоступна";
    case "invalid_transition":
      return "Смена статуса недоступна";
    case "dnd_blocks_ready":
      return "«Готов» недоступен в режиме «Не беспокоить»";
    case "status_change_in_progress":
      return "Смена статуса выполняется";
    case "break_reason_required":
      return "Требуется причина перерыва";
    default:
      return null;
  }
}

export function mapOperatorStatusDisabledReasonWithFallback(
  reason: string,
  fallback = "Действие недоступно",
): string {
  return mapOperatorStatusDisabledReason(reason) ?? fallback;
}
