import type { AgentStatusRejectionReason } from "@application/index.js";

/**
 * - Purpose: map agent status rejection reason keys to user-visible banner copy.
 * - Inputs: lastRejectionReason from operator status projection.
 * - Outputs: banner message string or null when no rejection to show.
 */
export function mapAgentStatusRejectionReason(
  reason: AgentStatusRejectionReason | null,
): string | null {
  if (reason === null) {
    return null;
  }

  switch (reason) {
    case "invalid_transition":
      return "Эта смена статуса недоступна.";
    case "dnd_blocks_ready":
      return "Нельзя перейти в «Готов» при активном режиме «Не беспокоить».";
    case "break_reason_required":
      return "Требуется корректная причина перерыва.";
    case "already_in_status":
      return "Вы уже в этом статусе.";
    case "gateway_failed":
      return "Платформа оператора отклонила смену статуса.";
    case "ocp_not_connected":
      return "Платформа оператора недоступна.";
    case "network_error":
      return "Сетевая ошибка при смене статуса. Повторите попытку.";
    default:
      return "Не удалось сменить статус.";
  }
}
