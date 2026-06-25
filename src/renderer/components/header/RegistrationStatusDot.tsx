import clsx from "clsx";
import type { JSX } from "react";
import type { RegistrationDotVariant } from "@application/index.js";
import styles from "./RegistrationStatusDot.module.css";

export type RegistrationStatusDotProps = Readonly<{
  variant: RegistrationDotVariant;
  label: string;
}>;

const VARIANT_CLASS: Record<RegistrationDotVariant, string> = {
  registering: styles["variant_registering"] ?? "",
  registered_online: styles["variant_registered_online"] ?? "",
  registered_offline: styles["variant_registered_offline"] ?? "",
  registered_dnd: styles["variant_registered_dnd"] ?? "",
  failed: styles["variant_failed"] ?? "",
  not_registered: styles["variant_not_registered"] ?? "",
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
    <span
      className={clsx(styles["dot"], VARIANT_CLASS[variant])}
      data-testid="registration-status-dot"
      data-variant={variant}
      role="status"
      aria-label={label}
      aria-busy={busy || undefined}
      title={label}
    />
  );
}
