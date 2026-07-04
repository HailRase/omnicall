import type { JSX } from "react";
import type {
  ActiveCallControlOperationError,
  CallLinesShellViewModel,
} from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import chromeTextStyles from "../shell/ShellChromeText.module.css";
import { CallLineRow } from "./CallLineRow.js";
import styles from "./CallLinesShell.module.css";

export type CallLinesShellProps = Readonly<{
  shell: CallLinesShellViewModel;
  lastOperationError: ActiveCallControlOperationError | null;
  compact?: boolean;
  onResumeLine: (callId: string) => void;
  onHangupLine: (callId: string) => void;
  onHoldLine: (callId: string) => void;
  onMuteLine: (callId: string) => void;
  onUnmuteLine: (callId: string) => void;
  onTransferLine: (callId: string) => void;
  onAnswerLine: (callId: string) => void;
  onRetryOperation: () => void;
}>;

/**
 * - Purpose: render call line list with unified row controls for single and multi-line.
 * - Inputs: shell view-model, operation error, and line action callbacks.
 * - Outputs: accessible list UI or null when no established lines.
 */
export function CallLinesShell({
  shell,
  lastOperationError,
  compact = false,
  onResumeLine,
  onHangupLine,
  onHoldLine,
  onMuteLine,
  onUnmuteLine,
  onTransferLine,
  onAnswerLine,
  onRetryOperation,
}: CallLinesShellProps): JSX.Element | null {
  const { t } = useI18n();
  if (!shell.visible) {
    return null;
  }

  return (
    <section
      className={styles.panel}
      data-testid="call-lines-panel"
      aria-label={t("call.lines.ariaLabel")}
    >
      {shell.policyErrorMessage !== null && !compact ? (
        <p
          className={chromeTextStyles.hintError}
          data-testid="multi-call-policy-error"
          role="alert"
        >
          {shell.policyErrorMessage}
        </p>
      ) : null}
      <ul className={styles.list}>
        {shell.lines.map((line) => (
          <CallLineRow
            key={line.callId}
            line={line}
            compact={compact}
            lastOperationError={line.isActiveUnheld ? lastOperationError : null}
            onResume={onResumeLine}
            onHangup={onHangupLine}
            onHold={onHoldLine}
            onMute={onMuteLine}
            onUnmute={onUnmuteLine}
            onTransfer={onTransferLine}
            onAnswer={onAnswerLine}
            onRetryOperation={onRetryOperation}
          />
        ))}
      </ul>
    </section>
  );
}
