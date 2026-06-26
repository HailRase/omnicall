import type { JSX } from "react";
import type { CallLinesShellViewModel } from "@application/index.js";
import chromeTextStyles from "../shell/ShellChromeText.module.css";
import { CallSessionTab } from "./CallSessionTab.js";
import styles from "./CallSessionTabs.module.css";

export type CallSessionTabsProps = Readonly<{
  shell: CallLinesShellViewModel;
  onSelectLine: (callId: string) => void;
}>;

/**
 * - Purpose: horizontal call session tab strip for multi-line switching.
 * - Inputs: call lines shell view-model and line select callback.
 * - Outputs: tablist UI or null when no established lines.
 * @uiMeta lf=LF-021 f=F-016 smoke=R7-*
 */
export function CallSessionTabs({
  shell,
  onSelectLine,
}: CallSessionTabsProps): JSX.Element | null {
  if (!shell.visible) {
    return null;
  }

  return (
    <section
      className={styles["panel"]}
      data-testid="call-session-tabs"
      aria-label="Активные звонки"
    >
      {shell.policyErrorMessage !== null ? (
        <p
          className={chromeTextStyles["hintError"]}
          data-testid="multi-call-policy-error"
          role="alert"
        >
          {shell.policyErrorMessage}
        </p>
      ) : null}
      <div className={styles["tablist"]} role="tablist" aria-label="Переключение звонков">
        {shell.lines.map((line) => (
          <CallSessionTab
            key={line.callId}
            line={line}
            selected={line.isActiveUnheld}
            onSelect={onSelectLine}
          />
        ))}
      </div>
    </section>
  );
}
