import clsx from "clsx";
import type { JSX } from "react";
import type { SipStatusDotTone } from "@application/index.js";
import styles from "./UserHeaderIdentity.module.css";

export type UserHeaderIdentityProps = Readonly<{
  displayName: string;
  sipStatusLabel: string;
  sipStatusTimerSuffix: string | null;
  sipStatusTone: SipStatusDotTone;
}>;

const SIP_STATUS_TONE_CLASS: Record<SipStatusDotTone, string> = {
  idle: styles["status_idle"] ?? "",
  connecting: styles["status_connecting"] ?? "",
  reconnecting: styles["status_reconnecting"] ?? "",
  disconnected: styles["status_disconnected"] ?? "",
  registering: styles["status_registering"] ?? "",
  not_registered: styles["status_not_registered"] ?? "",
  registered: styles["status_registered"] ?? "",
  dnd: styles["status_dnd"] ?? "",
};

/**
 * - Purpose: compact user name and SIP status line beside header avatar.
 * - Inputs: display name, SIP status label, optional timer suffix, tone.
 * - Outputs: truncated name stack with colored SIP status text.
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserHeaderIdentity({
  displayName,
  sipStatusLabel,
  sipStatusTimerSuffix,
  sipStatusTone,
}: UserHeaderIdentityProps): JSX.Element {
  const statusText =
    sipStatusTimerSuffix === null
      ? sipStatusLabel
      : `${sipStatusLabel} ${sipStatusTimerSuffix}`;

  return (
    <div className={styles["identity"]} data-testid="user-header-identity">
      <span className={styles["displayName"]} title={displayName}>
        {displayName}
      </span>
      <span
        className={clsx(styles["sipStatus"], SIP_STATUS_TONE_CLASS[sipStatusTone])}
        data-testid="user-sip-status"
        data-tone={sipStatusTone}
      >
        {statusText}
      </span>
    </div>
  );
}
