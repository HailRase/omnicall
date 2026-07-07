import type { CallHistoryShellViewModel } from "@application/projections/deriveCallHistoryShell.js";

type ResolveHistorySecondaryTimeLabelInput = Readonly<{
  entry: CallHistoryShellViewModel["entries"][number];
  language: string;
  translateDuration: (seconds: number) => string;
  formatClockTime: (iso: string, language: string) => string;
}>;

/**
 * - Purpose: choose duration or clock time for history list secondary line.
 * - Inputs: history entry shell fields and formatting callbacks.
 * - Outputs: duration for completed answered calls, clock time otherwise.
 */
export function resolveHistorySecondaryTimeLabel(
  input: ResolveHistorySecondaryTimeLabelInput,
): string {
  if (input.entry.outcomeKey === "history.outcome.completed" && input.entry.durationSec > 0) {
    return input.translateDuration(input.entry.durationSec);
  }

  return input.formatClockTime(input.entry.startedAtIso, input.language);
}
