import clsx from "clsx";
import type { JSX } from "react";
import type { RegistrationDotVariant } from "@application/index.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import styles from "./RegistrationStatusDot.module.css";

export type RegistrationStatusDotProps = Readonly<{
  variant: RegistrationDotVariant;
  label: string;
}>;

const VARIANT_CLASS: Record<RegistrationDotVariant, string> = {
  registering: styles.variantRegistering ?? "",
  registered_online: styles.variantRegisteredOnline ?? "",
  registered_offline: styles.variantRegisteredOffline ?? "",
  registered_dnd: styles.variantRegisteredDnd ?? "",
  failed: styles.variantFailed ?? "",
  not_registered: styles.variantNotRegistered ?? "",
};

/**
 * - Purpose: compact registration and phone status indicator for header (LF-011).
 * - Inputs: dot variant and human-readable label for accessibility.
 * - Outputs: colored status dot with non-color-only text in aria-label.
 * @uiMeta lf=LF-011 f=F-016 smoke=R7-*
 */
export function RegistrationStatusDot({
  variant,
  label,
}: RegistrationStatusDotProps): JSX.Element {
  const busy = variant === "registering";

  return (
    <IconTooltip label={label} className={styles.tooltipHost}>
      <span
        className={clsx(styles.dot, VARIANT_CLASS[variant])}
        data-testid="registration-status-dot"
        data-variant={variant}
        role="status"
        aria-label={label}
        aria-busy={busy || undefined}
      />
    </IconTooltip>
  );
}
