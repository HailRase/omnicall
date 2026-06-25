/**
 * - Purpose: map transfer projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from transfer or active-call transfer controls.
 * - Outputs: localized label string or null when key is not transfer-related.
 */
export function mapTransferDisabledReason(reason: string): string | null {
  switch (reason) {
    case "no_active_call":
      return "Нет активного звонка";
    case "transfer_not_allowed":
      return "Перевод недоступен";
    case "invalid_target":
      return "Некорректный номер перевода";
    case "transfer_in_progress":
      return "Перевод выполняется";
    case "consultation_in_progress":
      return "Консультация выполняется";
    case "second_session_disabled":
      return "Вторая сессия отключена";
    case "consultation_not_active":
      return "Консультация не готова";
    case "relationship_invalid":
      return "Некорректная связь звонков для перевода";
    case "no_source_call":
      return "Нет исходного звонка";
    case "transfer_mode_active":
      return "Режим перевода уже активен";
    default:
      return null;
  }
}

export function mapTransferDisabledReasonWithFallback(
  reason: string,
  fallback = "Действие недоступно",
): string {
  return mapTransferDisabledReason(reason) ?? fallback;
}
