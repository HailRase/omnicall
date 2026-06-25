import type { JSX } from "react";
import type { CallLinesShellViewModel } from "@application/index.js";
import { CallLineCard } from "./CallLineCard.js";

export type CallLinesShellProps = Readonly<{
  shell: CallLinesShellViewModel;
  onResumeLine: (callId: string) => void;
  onHangupLine: (callId: string) => void;
}>;

/**
 * - Purpose: render multi-line call panel with per-line controls.
 * - Inputs: shell view-model and line action callbacks.
 * - Outputs: accessible list UI or null when fewer than two lines.
 */
export function CallLinesShell({
  shell,
  onResumeLine,
  onHangupLine,
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
          <CallLineCard
            key={line.callId}
            line={line}
            onResume={onResumeLine}
            onHangup={onHangupLine}
          />
        ))}
      </ul>
    </section>
  );
}
