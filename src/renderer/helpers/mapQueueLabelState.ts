import type { QueueLabelState } from "@application/index.js";

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
      return { visible: true, text: "Ожидание", ariaBusy: true };
    case "ready":
      return {
        visible: true,
        text: queueName ?? "Неизвестно",
        ariaBusy: false,
      };
    case "na":
      return { visible: true, text: "Н/Д", ariaBusy: false };
  }
}
