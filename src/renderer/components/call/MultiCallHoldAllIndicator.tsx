import type { JSX } from "react";
import chromeTextStyles from "../shell/ShellChromeText.module.css";

export type MultiCallHoldAllIndicatorProps = Readonly<{
  visible: boolean;
}>;

/**
 * - Purpose: show hold-all-before-dial in-progress status in shell.
 * - Inputs: visibility flag from multi-call projection.
 * - Outputs: status element or null when not holding.
 */
export function MultiCallHoldAllIndicator({
  visible,
}: MultiCallHoldAllIndicatorProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <p
      className={chromeTextStyles["hint"]}
      data-testid="multi-call-hold-all-indicator"
      role="status"
    >
      Holding other calls…
    </p>
  );
}
