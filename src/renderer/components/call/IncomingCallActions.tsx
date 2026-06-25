import type { JSX } from "react";
import { IconControlButton } from "../icons/index.js";
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
        <IconControlButton
          iconId="call.answer"
          ariaLabel="Ответить на входящий звонок"
          testId="answer-call"
          className={styles["iconButton"]}
          disabledReason={answerDisabledReason}
          onClick={onAnswer}
        />
        <IconControlButton
          iconId="call.reject"
          ariaLabel="Отклонить входящий звонок"
          testId="reject-call"
          className={styles["iconButton"]}
          disabledReason={rejectDisabledReason}
          onClick={onReject}
        />
      </div>
    </div>
  );
}
