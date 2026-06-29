import clsx from "clsx";
import type { JSX, MouseEvent } from "react";
import { AppIcon } from "./AppIcon.js";
import { IconTooltip } from "./IconTooltip.js";
import { resolveIconEntry, resolveIconTooltipLabel, type IconSemanticId } from "./iconCatalog.js";
import styles from "./IconControlButton.module.css";

export type IconControlButtonProps = Readonly<{
  iconId: IconSemanticId;
  ariaLabel: string;
  tooltipLabel?: string | undefined;
  disabledReason?: string | null;
  testId?: string | undefined;
  className?: string | undefined;
  disabled?: boolean;
  ariaExpanded?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLButtonElement>) => void;
}>;

/**
 * - Purpose: icon-only control with catalog icon and delayed hover tooltip.
 * - Inputs: semantic icon id, a11y labels, disabled state, click handler.
 * - Outputs: accessible button wrapped in IconTooltip.
 */
export function IconControlButton({
  iconId,
  ariaLabel,
  tooltipLabel,
  disabledReason = null,
  testId,
  className,
  disabled = false,
  ariaExpanded,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: IconControlButtonProps): JSX.Element {
  const catalogLabel = resolveIconEntry(iconId).defaultLabel;
  const tooltip = resolveIconTooltipLabel(iconId, disabledReason, tooltipLabel ?? catalogLabel);
  const isDisabled = disabled || disabledReason !== null;
  const expandedProps =
    ariaExpanded === undefined ? {} : ({ "aria-expanded": ariaExpanded } as const);

  return (
    <IconTooltip label={tooltip}>
      <button
        type="button"
        className={clsx(styles["button"], className)}
        data-testid={testId}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        {...expandedProps}
      >
        <AppIcon id={iconId} decorative />
      </button>
    </IconTooltip>
  );
}
