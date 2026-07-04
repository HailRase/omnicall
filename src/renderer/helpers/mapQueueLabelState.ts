import type { QueueLabelState } from "@application/index.js";
import { translateCurrent } from "../i18n/index.js";

export type QueueLabelDisplay = Readonly<{
  visible: boolean;
  text: string;
  ariaBusy: boolean;
}>;

/**
 * - Purpose: map queue label projection state to user-visible copy (LF-037).
 * - Inputs: labelState, resolved queueName when ready.
 * - Outputs: visibility, display text, and aria-busy flag.
 */
export function mapQueueLabelState(
  labelState: QueueLabelState,
  queueName: string | null,
): QueueLabelDisplay {
  switch (labelState) {
    case "hidden":
      return { visible: false, text: "", ariaBusy: false };
    case "loading":
      return { visible: true, text: translateCurrent("queue.label.loading"), ariaBusy: true };
    case "ready":
      return {
        visible: true,
        text: queueName ?? translateCurrent("queue.label.unknown"),
        ariaBusy: false,
      };
    case "na":
      return { visible: true, text: translateCurrent("queue.label.na"), ariaBusy: false };
  }
}
