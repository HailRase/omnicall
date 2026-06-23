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
        <strong>Caller:</strong> {callerNumber ?? "Unknown"}
      </p>
      <p>
        <strong>Name:</strong> {displayName ?? "Unavailable"}
      </p>
      <QueueInfoLabel labelState={queueLabelState} queueName={queueName} />
      {campaignContextTitle !== null && (
        <p data-testid="incoming-campaign-context" aria-label="Campaign">
          <strong>Campaign:</strong> {campaignContextTitle}
        </p>
      )}
    </section>
  );
}
