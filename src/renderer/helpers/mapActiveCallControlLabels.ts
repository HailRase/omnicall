import type { ActiveCallControlOperationError } from "@application/index.js";
import { mapTransferDisabledReason } from "./mapTransferDisabledReason.js";

/**
 * - Purpose: map active call control disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from active call controls projection.
 * - Outputs: localized label string.
 */
export function mapActiveCallControlDisabledReason(
  reason: string,
  fallback = "Действие недоступно",
): string {
  const transferLabel = mapTransferDisabledReason(reason);
  if (transferLabel !== null) {
    return transferLabel;
  }

  switch (reason) {
    case "call_ending":
      return "Завершение звонка";
    case "hold_requires_active":
      return "Удержание доступно только на активном звонке";
    case "resume_requires_held":
      return "Возобновление доступно только на удержанном звонке";
    case "mute_requires_active_or_held":
      return "Отключение микрофона доступно на активном или удержанном звонке";
    case "already_muted":
      return "Микрофон уже отключён";
    case "not_muted":
      return "Микрофон не отключён";
    case "hangup_not_allowed":
      return "Завершение звонка недоступно";
    default:
      return fallback;
  }
}

/**
 * - Purpose: map active call control operation error to user-visible banner text.
 * - Inputs: last operation error from active call controls projection.
 * - Outputs: error banner message string.
 */
export function mapActiveCallControlOperationError(
  error: ActiveCallControlOperationError,
): string {
  const label = mapActiveCallControlOperationLabel(error.operation);
  return `${label}: ошибка — ${error.message}`;
}

function mapActiveCallControlOperationLabel(
  operation: ActiveCallControlOperationError["operation"],
): string {
  switch (operation) {
    case "hold":
      return "Удержание";
    case "resume":
      return "Возобновление";
    case "mute":
      return "Отключение микрофона";
    case "unmute":
      return "Включение микрофона";
    case "hangup":
      return "Завершение звонка";
  }
}
