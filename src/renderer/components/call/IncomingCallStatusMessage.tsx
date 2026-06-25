import type { JSX } from "react";
import type { IncomingCallUiState } from "@application/index.js";

export type IncomingCallStatusMessageProps = Readonly<{
  uiState: IncomingCallUiState;
}>;

export function IncomingCallStatusMessage({
  uiState,
}: IncomingCallStatusMessageProps): JSX.Element {
  return (
    <p data-testid="incoming-call-status">
      <strong>Статус:</strong> {toStatusLabel(uiState)}
    </p>
  );
}

function toStatusLabel(uiState: IncomingCallUiState): string {
  switch (uiState) {
    case "answerFailed":
      return "Ошибка ответа";
    case "rejectFailed":
      return "Ошибка отклонения";
    case "dndAutoRejecting":
      return "Автоотклонение по режиму «Не беспокоить»";
    case "incomingEndedBeforeAnswer":
      return "Завершён до ответа";
    case "answering":
      return "Ответ выполняется";
    case "rejecting":
      return "Отклонение выполняется";
    default:
      return "Вызов";
  }
}
