import type { JSX } from "react";
import type { IncomingCallUiState } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";

export type IncomingCallStatusMessageProps = Readonly<{
  uiState: IncomingCallUiState;
}>;

export function IncomingCallStatusMessage({
  uiState,
}: IncomingCallStatusMessageProps): JSX.Element {
  const { t } = useI18n();
  return (
    <p data-testid="incoming-call-status">
      <strong>{t("incoming.status.labelPrefix")}:</strong> {toStatusLabel(t, uiState)}
    </p>
  );
}

function toStatusLabel(
  t: ReturnType<typeof useI18n>["t"],
  uiState: IncomingCallUiState,
): string {
  switch (uiState) {
    case "answerFailed":
      return t("incoming.status.answerFailed");
    case "rejectFailed":
      return t("incoming.status.rejectFailed");
    case "dndAutoRejecting":
      return t("incoming.status.dndAutoRejecting");
    case "incomingEndedBeforeAnswer":
      return t("incoming.status.endedBeforeAnswer");
    case "answering":
      return t("incoming.status.answering");
    case "rejecting":
      return t("incoming.status.rejecting");
    default:
      return t("incoming.status.default");
  }
}
