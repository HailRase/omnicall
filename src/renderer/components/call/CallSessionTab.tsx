import clsx from "clsx";
import type { JSX } from "react";
import type { CallLineCardViewModel } from "@application/index.js";
import { useCallDuration } from "../../hooks/useCallDuration.js";
import { AppIcon } from "../icons/AppIcon.js";
import styles from "./CallSessionTab.module.css";

export type CallSessionTabProps = Readonly<{
  line: CallLineCardViewModel;
  selected: boolean;
  onSelect: (callId: string) => void;
}>;

/**
 * - Purpose: compact call session tab for multi-line switching above dialpad.
 * - Inputs: line view-model, selection state, select callback.
 * - Outputs: accessible tab button with number, timer, hold badge, mute icon.
 * @uiMeta lf=LF-021,LF-022 f=F-016 smoke=R7-*
 */
export function CallSessionTab({
  line,
  selected,
  onSelect,
}: CallSessionTabProps): JSX.Element {
  const duration = useCallDuration(line.durationStartedAt);
  const showHoldBadge = line.state === "Held" || line.statusLabel === "На удалённом удержании";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={clsx(styles["tab"], selected && styles["tabSelected"])}
      data-testid={`call-session-tab-${line.callId}`}
      aria-label={`Звонок ${line.displayName}, ${line.statusLabel}`}
      onClick={() => {
        onSelect(line.callId);
      }}
    >
      <span className={styles["number"]} data-testid={`call-session-number-${line.callId}`}>
        {line.displayName}
      </span>
      <span className={styles["meta"]}>
        {duration.length > 0 ? (
          <span className={styles["duration"]} data-testid={`call-session-duration-${line.callId}`}>
            {duration}
          </span>
        ) : null}
        {showHoldBadge ? (
          <span className={styles["holdBadge"]} data-testid={`call-session-hold-${line.callId}`}>
            Удерж.
          </span>
        ) : null}
        {line.muted ? (
          <span
            className={styles["muteIcon"]}
            data-testid={`call-session-muted-${line.callId}`}
            aria-hidden
          >
            <AppIcon id="call.mute" size={14} decorative />
          </span>
        ) : null}
      </span>
    </button>
  );
}
