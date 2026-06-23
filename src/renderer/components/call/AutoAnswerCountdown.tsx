import type { JSX } from "react";

export type AutoAnswerCountdownProps = Readonly<{
  secondsRemaining: number | null;
}>;

export function AutoAnswerCountdown({
  secondsRemaining,
}: AutoAnswerCountdownProps): JSX.Element | null {
  if (secondsRemaining === null) {
    return null;
  }

  return (
    <p data-testid="auto-answer-countdown" aria-live="polite">
      Auto answer in {secondsRemaining}s
    </p>
  );
}
