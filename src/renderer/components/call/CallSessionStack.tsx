import type { JSX } from "react";
import type { CallLinesShellViewModel } from "@application/index.js";
import { mapActiveCallControlDisabledReason } from "../../helpers/mapActiveCallControlLabels.js";
import chromeTextStyles from "../shell/ShellChromeText.module.css";
import { IconControlButton } from "../icons/index.js";
import { CallSessionCard } from "./CallSessionCard.js";
import styles from "./CallSessionStack.module.css";

export type CallSessionStackProps = Readonly<{
  shell: CallLinesShellViewModel;
  onSelectLine: (callId: string) => void;
  onHangupLine: (callId: string) => void;
}>;

/**
 * - Purpose: vertical multi-session rail matching reference SessionStack layout.
 * - Inputs: call lines shell view-model and line action callbacks.
 * - Outputs: stacked compact session cards with per-line hangup control.
 * @uiMeta lf=LF-021 f=F-016 smoke=R7-*
 */
export function CallSessionStack({
  shell,
  onSelectLine,
  onHangupLine,
}: CallSessionStackProps): JSX.Element | null {
  if (!shell.visible || shell.lines.length < 2) {
    return null;
  }

  return (
    <section
      className={styles["panel"]}
      data-testid="call-session-stack"
      aria-label="Сессии звонков"
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
      <p className={styles["heading"]}>
        Сессии · {shell.lines.length}
      </p>
      <ul className={styles["list"]}>
        {shell.lines.map((line) => (
          <li key={line.callId} className={styles["row"]}>
            <div className={styles["cardWrap"]}>
              <CallSessionCard
                line={line}
                compact
                isActive={line.isActiveUnheld}
                onClick={() => {
                  onSelectLine(line.callId);
                }}
              />
            </div>
            <IconControlButton
              iconId="call.hangup"
              ariaLabel="Завершить сессию"
              tooltipLabel="Завершить"
              testId={`call-session-hangup-${line.callId}`}
              className={styles["hangupButton"]}
              disabledReason={
                line.hangupDisabledReason === null
                  ? null
                  : mapActiveCallControlDisabledReason(line.hangupDisabledReason)
              }
              onClick={() => {
                onHangupLine(line.callId);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
