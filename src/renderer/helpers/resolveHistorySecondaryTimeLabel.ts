import type { CallHistoryShellViewModel } from "@application/projections/contacts/deriveCallHistoryShell.js";

type ResolveHistorySecondaryTimeLabelInput = Readonly<{
  entry: CallHistoryShellViewModel["entries"][number];
  language: string;
  formatClockTime: (iso: string, language: string) => string;
}>;

/**
 * - Purpose: choose clock time for history list secondary line.
 * - Inputs: history entry shell fields and formatting callback.
 * - Outputs: call start clock time for every list row.
 */
export function resolveHistorySecondaryTimeLabel(
  input: ResolveHistorySecondaryTimeLabelInput,
): string {
  return input.formatClockTime(input.entry.startedAtIso, input.language);
}
