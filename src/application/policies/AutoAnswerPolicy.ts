import type { IncomingCallSettings } from "@ports/index.js";

export type AutoAnswerDecision = Readonly<{
  enabled: true;
  timeoutSec: number;
}> | null;

export function decideAutoAnswer(
  settings: IncomingCallSettings,
): AutoAnswerDecision {
  const timeoutSec = settings.autoAnswerTimeoutSec;
  if (timeoutSec === null || timeoutSec <= 0) {
    return null;
  }
  return {
    enabled: true,
    timeoutSec,
  };
}
