import clsx from "clsx";
import type { JSX } from "react";
import { useCallDuration } from "../../../hooks/useCallDuration.js";
import { useI18n } from "../../../i18n/index.js";

export type OcpStatusTimerProps = Readonly<{
  since: number | null;
  className?: string;
}>;

/**
 * - Purpose: show elapsed time since current OCP operator status started.
 * - Inputs: status-since epoch ms or null; optional className for chip layout.
 * - Outputs: always-padded hh:mm:ss text with accessible label; null when since missing.
 */
export function OcpStatusTimer({
  since,
  className,
}: OcpStatusTimerProps): JSX.Element | null {
  const { t } = useI18n();
  const elapsed = useCallDuration(since, "hh:mm:ss");

  if (since === null || elapsed.length === 0) {
    return null;
  }

  return (
    <span
      className={clsx(className)}
      data-testid="ocp-status-timer"
      aria-label={t("ocp.status.timer.aria", { elapsed })}
    >
      {elapsed}
    </span>
  );
}
