import type { JSX } from "react";
import type { QueueLabelState } from "@application/index.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";
import { useI18n } from "../../i18n/index.js";

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
  const { t } = useI18n();
  const display = mapQueueLabelState(labelState, queueName);

  if (!display.visible) {
    return null;
  }

  return (
    <p
      data-testid="queue-info-label"
      aria-label={t("queue.ariaLabel")}
      aria-busy={display.ariaBusy}
    >
      <strong>{t("queue.labelPrefix")}:</strong> {display.text}
    </p>
  );
}
