import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: format auto-answer countdown copy for incoming call UI.
 * - Inputs: remaining seconds from live countdown hook.
 * - Outputs: Russian user-visible countdown label.
 */
export function formatAutoAnswerCountdownLabel(secondsRemaining: number): string {
  return translateCurrent("incoming.autoAnswer.countdown", {
    seconds: secondsRemaining,
  });
}
