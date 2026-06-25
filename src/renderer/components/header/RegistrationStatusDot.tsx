import type { JSX } from "react";
import type { RegistrationDotVariant } from "@application/index.js";

export type RegistrationStatusDotProps = Readonly<{
  variant: RegistrationDotVariant;
  label: string;
}>;

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
      className={`registration-status-dot registration-status-dot--${variant}`}
      data-testid="registration-status-dot"
      data-variant={variant}
      role="status"
      aria-label={label}
      aria-busy={busy || undefined}
      title={label}
    />
  );
}
