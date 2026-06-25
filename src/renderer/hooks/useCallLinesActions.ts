import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { CallLinesShellViewModel } from "@application/index.js";

type UseCallLinesActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  shell: CallLinesShellViewModel;
}>;

type UseCallLinesActionsResult = Readonly<{
  handleResumeLine: (callId: string) => void;
  handleHangupLine: (callId: string) => void;
}>;

/**
 * - Purpose: bind per-line resume and hangup intents to facade methods.
 * - Inputs: bootstrap facade and call lines shell view-model.
 * - Outputs: guarded line action handlers.
 */
export function useCallLinesActions(
  input: UseCallLinesActionsInput,
): UseCallLinesActionsResult {
  const { facade, shell } = input;

  const handleResumeLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = shell.lines.find((entry) => entry.callId === callId);
    if (line === undefined || line.resumeDisabledReason !== null) {
      return;
    }
    void facade.resumeCallById(callId);
  };

  const handleHangupLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = shell.lines.find((entry) => entry.callId === callId);
    if (line === undefined || line.hangupDisabledReason !== null) {
      return;
    }
    void facade.hangupCallById(callId);
  };

  return {
    handleResumeLine,
    handleHangupLine,
  };
}
