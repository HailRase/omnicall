import type { JSX } from "react";

export type IncomingCallActionsProps = Readonly<{
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
  onAnswer: () => void;
  onReject: () => void;
}>;

export function IncomingCallActions({
  answerDisabledReason,
  rejectDisabledReason,
  onAnswer,
  onReject,
}: IncomingCallActionsProps): JSX.Element {
  return (
    <div>
      {answerDisabledReason !== null && (
        <p
          data-testid="incoming-answer-disabled-reason"
          role="status"
          className="incoming-call__disabled-reason"
        >
          {answerDisabledReason}
        </p>
      )}
      <button
        type="button"
        data-testid="answer-call"
        aria-label="Answer incoming call"
        disabled={answerDisabledReason !== null}
        title={answerDisabledReason ?? undefined}
        onClick={onAnswer}
      >
        Answer
      </button>
      <button
        type="button"
        data-testid="reject-call"
        aria-label="Reject incoming call"
        disabled={rejectDisabledReason !== null}
        title={rejectDisabledReason ?? undefined}
        onClick={onReject}
      >
        Reject
      </button>
    </div>
  );
}
