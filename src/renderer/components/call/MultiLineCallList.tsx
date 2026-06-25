import type { JSX } from "react";
import type { CallLine } from "@application/index.js";
import { deriveCallLineStatusLabel } from "@application/index.js";
import styles from "./MultiLineCallList.module.css";

export type MultiLineCallListProps = Readonly<{
  lines: ReadonlyArray<CallLine>;
}>;

/**
 * - Purpose: render presentational multi-line call rows for attended transfer.
 * - Inputs: call line projection entries with role and state.
 * - Outputs: accessible list UI without business logic.
 */
export function MultiLineCallList({ lines }: MultiLineCallListProps): JSX.Element | null {
  if (lines.length === 0) {
    return null;
  }

  return (
    <ul
      className={styles["list"]}
      data-testid="multi-line-call-list"
      aria-label="Активные линии звонков"
    >
      {lines.map((line) => (
        <li
          key={line.callId}
          className={styles["item"]}
          data-testid={`call-line-${line.callId}`}
        >
          <span className={styles["role"]}>{mapRoleLabel(line.role)}</span>
          <span className={styles["state"]}>
            {deriveCallLineStatusLabel({ state: line.state })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function mapRoleLabel(role: CallLine["role"]): string {
  switch (role) {
    case "source":
      return "Исходный";
    case "consultation":
      return "Консультация";
    case "primary":
      return "Основной";
  }
}
