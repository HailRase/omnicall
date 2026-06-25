import type { JSX } from "react";
import type {
  ActiveCallControlOperationError,
  CallLinesShellViewModel,
} from "@application/index.js";
import { CallLineRow } from "./CallLineRow.js";

export type CallLinesShellProps = Readonly<{
  shell: CallLinesShellViewModel;
  lastOperationError: ActiveCallControlOperationError | null;
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
  onResumeLine,
  onHangupLine,
  onHoldLine,
  onMuteLine,
  onUnmuteLine,
  onTransferLine,
  onAnswerLine,
  onRetryOperation,
}: CallLinesShellProps): JSX.Element | null {
  if (!shell.visible) {
    return null;
  }

  return (
    <section
      className="call-lines-shell"
      data-testid="call-lines-panel"
      aria-label="Active call lines"
    >
      {shell.policyErrorMessage !== null ? (
        <p
          className="shell__hint shell__hint--error"
          data-testid="multi-call-policy-error"
          role="alert"
        >
          {shell.policyErrorMessage}
        </p>
      ) : null}
      <ul className="call-lines-shell__list">
        {shell.lines.map((line) => (
          <CallLineRow
            key={line.callId}
            line={line}
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
