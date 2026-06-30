import type { IncomingCallSettings } from "@ports/index.js";
import { resolveAutoAnswerSchedule } from "@domain/index.js";

export type AutoAnswerDecision = Readonly<{
  enabled: true;
  timeoutSec: number;
}> | null;

/**
 * - Purpose: map incoming-call settings to auto-answer schedule decision.
 * - Inputs: IncomingCallSettings from settings repository.
 * - Outputs: enabled schedule or null when auto-answer is off.
 */
export function decideAutoAnswer(
  settings: IncomingCallSettings,
): AutoAnswerDecision {
  const schedule = resolveAutoAnswerSchedule(settings.autoAnswerTimeoutSec);
  if (schedule === null) {
    return null;
  }
  return {
    enabled: true,
    timeoutSec: schedule.timeoutSec,
  };
}
