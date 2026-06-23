import type { JSX } from "react";
import type { QueueLabelState } from "@application/index.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";

export type QueueInfoLabelProps = Readonly<{
  labelState: QueueLabelState;
  queueName: string | null;
}>;

/**
 * - Purpose: render projection-driven queue name label on incoming/active call (LF-037).
 * - Inputs: labelState, queueName when ready.
 * - Outputs: accessible queue label or null when hidden.
 */
export function QueueInfoLabel({
  labelState,
  queueName,
}: QueueInfoLabelProps): JSX.Element | null {
  const display = mapQueueLabelState(labelState, queueName);

  if (!display.visible) {
    return null;
  }

  return (
    <p
      data-testid="queue-info-label"
      aria-label="Queue"
      aria-busy={display.ariaBusy}
    >
      <strong>Queue:</strong> {display.text}
    </p>
  );
}
