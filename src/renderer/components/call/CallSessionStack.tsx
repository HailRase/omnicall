import type { JSX } from "react";
import type { CallLinesShellViewModel } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import chromeTextStyles from "../shell/ShellChromeText.module.css";
import { CallSessionCard } from "./CallSessionCard.js";
import styles from "./CallSessionStack.module.css";

export type CallSessionStackProps = Readonly<{
  shell: CallLinesShellViewModel;
  activeCallId: string | null;
  onSelectLine: (callId: string) => void;
}>;

/**
 * - Purpose: vertical multi-session rail matching reference SessionStack layout.
 * - Inputs: call lines shell view-model and line select callback.
 * - Outputs: stacked compact session cards for multi-call selection.
 * @uiMeta lf=LF-021 f=F-016 smoke=R7-*
 */
export function CallSessionStack({
  shell,
  activeCallId,
  onSelectLine,
}: CallSessionStackProps): JSX.Element | null {
  const { t } = useI18n();
  if (!shell.visible || shell.lines.length < 2) {
    return null;
  }

  return (
    <section
      className={styles.panel}
      data-testid="call-session-stack"
      aria-label={t("call.sessions.ariaLabel")}
    >
      {shell.policyErrorMessage !== null ? (
        <p
          className={chromeTextStyles.hintError}
          data-testid="multi-call-policy-error"
          role="alert"
        >
          {shell.policyErrorMessage}
        </p>
      ) : null}
      <p className={styles.heading}>
        {t("call.sessions.heading", { count: shell.lines.length })}
      </p>
      <ul className={styles.list}>
        {shell.lines.map((line) => (
          <li key={line.callId}>
            <CallSessionCard
              line={line}
              compact
              isActive={line.callId === activeCallId}
              onClick={() => {
                onSelectLine(line.callId);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
