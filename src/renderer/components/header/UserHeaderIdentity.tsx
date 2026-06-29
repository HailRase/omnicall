import clsx from "clsx";
import type { JSX } from "react";
import type { PresenceStatusTone } from "@application/index.js";
import styles from "./UserHeaderIdentity.module.css";

export type UserHeaderIdentityProps = Readonly<{
  displayName: string;
  presenceStatusLabel: string;
  presenceStatusTone: PresenceStatusTone;
}>;

const PRESENCE_TONE_CLASS: Record<PresenceStatusTone, string> = {
  online: styles["presence_online"] ?? "",
  offline: styles["presence_offline"] ?? "",
  dnd: styles["presence_dnd"] ?? "",
};

/**
 * - Purpose: compact user name and presence label beside header avatar.
 * - Inputs: display name, presence label, and presence tone variant.
 * - Outputs: truncated name stack with colored presence status text.
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserHeaderIdentity({
  displayName,
  presenceStatusLabel,
  presenceStatusTone,
}: UserHeaderIdentityProps): JSX.Element {
  return (
    <div className={styles["identity"]} data-testid="user-header-identity">
      <span className={styles["displayName"]} title={displayName}>
        {displayName}
      </span>
      <span
        className={clsx(styles["presenceStatus"], PRESENCE_TONE_CLASS[presenceStatusTone])}
        data-testid="user-presence-status"
        data-tone={presenceStatusTone}
      >
        {presenceStatusLabel}
      </span>
    </div>
  );
}
