import clsx from "clsx";
import type { JSX, MouseEvent } from "react";
import { AppIcon } from "../icons/AppIcon.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import styles from "./ListQuickCallButton.module.css";

export type ListQuickCallButtonProps = Readonly<{
  ariaLabel: string;
  tooltipLabel?: string;
  disabledReason?: string | null;
  testId?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}>;

/**
 * - Purpose: compact circular quick-call affordance for contact and history list rows.
 * - Inputs: accessible labels, optional disabled reason, and click callback.
 * - Outputs: small accent call button with delayed tooltip when disabled.
 */
export function ListQuickCallButton({
  ariaLabel,
  tooltipLabel,
  disabledReason = null,
  testId,
  onClick,
}: ListQuickCallButtonProps): JSX.Element {
  const isDisabled = disabledReason !== null;
  const tooltip = isDisabled ? disabledReason : (tooltipLabel ?? ariaLabel);

  return (
    <IconTooltip label={tooltip}>
      <button
        type="button"
        className={clsx(styles.button, isDisabled && styles.buttonDisabled)}
        data-testid={testId}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={onClick}
      >
        <AppIcon id="dial.call" decorative size={14} />
      </button>
    </IconTooltip>
  );
}
