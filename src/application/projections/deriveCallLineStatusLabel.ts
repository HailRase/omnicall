import type { CallState } from "@domain/index.js";

export type CallLineStatusInput = Readonly<{
  state: CallState | "Idle";
}>;

/**
 * - Purpose: derive human-readable call line status from projection state.
 * - Inputs: line state and optional remote-hold flag.
 * - Outputs: operator-facing status label string.
 */
export function deriveCallLineStatusLabel(input: CallLineStatusInput): string {
  switch (input.state) {
    case "Connecting":
      return "Соединение";
    case "Ringing":
      return "Вызов";
    case "Active":
      return "На линии";
    case "Held":
      return "На удержании";
    case "Transferring":
      return "Перевод";
    case "Ending":
      return "Завершение";
    case "Ended":
      return "Завершён";
    case "Failed":
      return "Ошибка";
    case "Idle":
      return "Ожидание";
    default:
      return "Неизвестно";
  }
}
