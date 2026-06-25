import type { JSX } from "react";
import { AppIcon } from "../icons/index.js";
import chromeTextStyles from "../shell/ShellChromeText.module.css";
import styles from "./MultiCallHoldAllIndicator.module.css";

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
    <div
      className={chromeTextStyles["hint"]}
      data-testid="multi-call-hold-all-indicator"
      role="status"
    >
      <span className={styles["icon"]}>
        <AppIcon id="call.hold" decorative />
      </span>
      Holding other calls…
    </div>
  );
}
