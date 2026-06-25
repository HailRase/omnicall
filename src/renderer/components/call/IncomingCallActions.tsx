import type { JSX } from "react";
import styles from "./IncomingCallActions.module.css";

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
    <div className={styles["actions"]}>
      {answerDisabledReason !== null && (
        <p
          data-testid="incoming-answer-disabled-reason"
          role="status"
          className={styles["disabledReason"]}
        >
          {answerDisabledReason}
        </p>
      )}
      <div className={styles["buttonGroup"]}>
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
    </div>
  );
}
