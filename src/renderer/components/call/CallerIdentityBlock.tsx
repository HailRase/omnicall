import type { JSX } from "react";
import type { QueueLabelState } from "@application/index.js";
import { QueueInfoLabel } from "./QueueInfoLabel.js";

export type CallerIdentityBlockProps = Readonly<{
  callerNumber: string | null;
  displayName: string | null;
  queueLabelState: QueueLabelState;
  queueName: string | null;
  campaignContextTitle: string | null;
}>;

export function CallerIdentityBlock({
  callerNumber,
  displayName,
  queueLabelState,
  queueName,
  campaignContextTitle,
}: CallerIdentityBlockProps): JSX.Element {
  return (
    <section data-testid="caller-identity">
      <p>
        <strong>Абонент:</strong> {callerNumber ?? "Неизвестно"}
      </p>
      <p>
        <strong>Имя:</strong> {displayName ?? "Недоступно"}
      </p>
      <QueueInfoLabel labelState={queueLabelState} queueName={queueName} />
      {campaignContextTitle !== null && (
        <p data-testid="incoming-campaign-context" aria-label="Кампания">
          <strong>Кампания:</strong> {campaignContextTitle}
        </p>
      )}
    </section>
  );
}
