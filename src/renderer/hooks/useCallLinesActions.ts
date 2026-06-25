import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { CallLinesShellViewModel } from "@application/index.js";

type UseCallLinesActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  shell: CallLinesShellViewModel;
}>;

type UseCallLinesActionsResult = Readonly<{
  handleResumeLine: (callId: string) => void;
  handleHangupLine: (callId: string) => void;
  handleHoldLine: (callId: string) => void;
  handleMuteLine: (callId: string) => void;
  handleUnmuteLine: (callId: string) => void;
  handleAnswerLine: (callId: string) => void;
}>;

/**
 * - Purpose: bind per-line call control intents to facade methods.
 * - Inputs: bootstrap facade and call lines shell view-model.
 * - Outputs: guarded line action handlers.
 */
export function useCallLinesActions(
  input: UseCallLinesActionsInput,
): UseCallLinesActionsResult {
  const { facade, shell } = input;

  const findLine = (callId: string) => shell.lines.find((entry) => entry.callId === callId);

  const handleResumeLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.resumeDisabledReason !== null) {
      return;
    }
    void facade.resumeCallById(callId);
  };

  const handleHangupLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.hangupDisabledReason !== null) {
      return;
    }
    void facade.hangupCallById(callId);
  };

  const handleHoldLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.holdDisabledReason !== null) {
      return;
    }
    void facade.holdCallById(callId);
  };

  const handleMuteLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.muteDisabledReason !== null) {
      return;
    }
    void facade.muteCallById(callId);
  };

  const handleUnmuteLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.unmuteDisabledReason !== null) {
      return;
    }
    void facade.unmuteCallById(callId);
  };

  const handleAnswerLine = (callId: string): void => {
    if (facade === null) {
      return;
    }
    const line = findLine(callId);
    if (line === undefined || line.primaryAction !== "answer") {
      return;
    }
    void facade.answerCallById(callId);
  };

  return {
    handleResumeLine,
    handleHangupLine,
    handleHoldLine,
    handleMuteLine,
    handleUnmuteLine,
    handleAnswerLine,
  };
}
