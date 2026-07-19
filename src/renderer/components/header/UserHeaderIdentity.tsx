import clsx from "clsx";
import type { JSX } from "react";
import type { SipStatusDotTone } from "@application/index.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import styles from "./UserHeaderIdentity.module.css";

export type UserHeaderIdentityProps = Readonly<{
  displayName: string;
  sipStatusLabel: string;
  sipStatusTimerSuffix: string | null;
  sipStatusTone: SipStatusDotTone;
  /** `menu` — full-width block inside avatar popup; `inline` — legacy compact header stack. */
  variant?: "inline" | "menu";
}>;

const SIP_STATUS_TONE_CLASS: Record<SipStatusDotTone, string> = {
  idle: styles.statusIdle ?? "",
  connecting: styles.statusConnecting ?? "",
  reconnecting: styles.statusReconnecting ?? "",
  disconnected: styles.statusDisconnected ?? "",
  registering: styles.statusRegistering ?? "",
  not_registered: styles.statusNotRegistered ?? "",
  registered: styles.statusRegistered ?? "",
  dnd: styles.statusDnd ?? "",
};

/**
 * - Purpose: user name + SIP registration status (header or avatar menu header).
 * - Inputs: display name, SIP status label, optional timer suffix, tone, layout variant.
 * - Outputs: truncated name stack with colored SIP status text (non-interactive).
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserHeaderIdentity({
  displayName,
  sipStatusLabel,
  sipStatusTimerSuffix,
  sipStatusTone,
  variant = "inline",
}: UserHeaderIdentityProps): JSX.Element {
  return (
    <div
      className={clsx(styles.identity, variant === "menu" && styles.identityMenu)}
      data-testid="user-header-identity"
      data-variant={variant}
    >
      <IconTooltip label={displayName} className={styles.displayNameTooltipHost}>
        <span className={styles.displayName}>{displayName}</span>
      </IconTooltip>
      <div className={styles.sipStatusBlock}>
        <span
          className={clsx(styles.sipStatus, SIP_STATUS_TONE_CLASS[sipStatusTone])}
          data-testid="user-sip-status"
          data-tone={sipStatusTone}
        >
          {sipStatusLabel}
        </span>
        {sipStatusTimerSuffix !== null ? (
          <span
            className={clsx(styles.sipStatusTimer, SIP_STATUS_TONE_CLASS[sipStatusTone])}
            data-testid="user-sip-status-timer"
            aria-hidden="true"
          >
            {sipStatusTimerSuffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
