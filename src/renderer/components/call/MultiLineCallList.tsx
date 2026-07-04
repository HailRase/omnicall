import type { JSX } from "react";
import type { CallLine } from "@application/index.js";
import { deriveCallLineStatusLabel } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
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
  const { t } = useI18n();
  if (lines.length === 0) {
    return null;
  }

  return (
    <ul
      className={styles["list"]}
      data-testid="multi-line-call-list"
      aria-label={t("call.lines.ariaLabel")
      }
    >
      {lines.map((line) => (
        <li
          key={line.callId}
          className={styles["item"]}
          data-testid={`call-line-${line.callId}`}
        >
          <span className={styles["role"]}>{mapRoleLabel(t, line.role)}</span>
          <span className={styles["state"]}>
            {deriveCallLineStatusLabel({ state: line.state })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function mapRoleLabel(
  t: ReturnType<typeof useI18n>["t"],
  role: CallLine["role"],
): string {
  switch (role) {
    case "source":
      return t("call.role.source");
    case "consultation":
      return t("call.role.consultation");
    case "primary":
      return t("call.role.primary");
  }
}
