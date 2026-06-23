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
      <strong>Status:</strong> {toStatusLabel(uiState)}
    </p>
  );
}

function toStatusLabel(uiState: IncomingCallUiState): string {
  switch (uiState) {
    case "answerFailed":
      return "Answer failed";
    case "rejectFailed":
      return "Reject failed";
    case "dndAutoRejecting":
      return "Auto rejecting by DND";
    case "incomingEndedBeforeAnswer":
      return "Ended before answer";
    case "answering":
      return "Answering";
    case "rejecting":
      return "Rejecting";
    default:
      return "Ringing";
  }
}
