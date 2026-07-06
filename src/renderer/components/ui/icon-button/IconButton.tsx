import clsx from "clsx";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type JSX,
  type MouseEvent,
  type Ref,
} from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import type { IconSemanticId } from "../../icons/iconCatalog.js";
import type { ControlSize, IconButtonVariant } from "../types.js";
import styles from "./IconButton.module.css";

export type IconButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    iconId: IconSemanticId;
    ariaLabel: string;
    variant?: IconButtonVariant;
    size?: ControlSize;
    tooltipLabel?: string;
    disabledReason?: string | null;
    loading?: boolean;
    preferAnimated?: boolean;
    className?: string;
  }
>;

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  primary: styles.variantPrimary ?? "",
  secondary: styles.variantSecondary ?? "",
  outline: styles.variantOutline ?? "",
  ghost: styles.variantGhost ?? "",
  destructive: styles.variantDestructive ?? "",
};

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

const ICON_PIXEL_SIZE: Record<ControlSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

function resolveTooltipLabel(
  disabledReason: string | null | undefined,
  tooltipLabel: string | undefined,
): string {
  if (disabledReason !== undefined && disabledReason !== null && disabledReason.length > 0) {
    return disabledReason;
  }
  return tooltipLabel ?? "";
}

/**
 * - Purpose: icon-only UI Kit action with semantic icon layer and optional tooltip.
 * - Inputs: iconId, ariaLabel, variant, size, tooltip, disabled reason, loading.
 * - Outputs: accessible square button with catalog icon and visual states.
 */
export const IconButton = forwardRef(function IconButton(
  {
    iconId,
    ariaLabel,
    variant = "ghost",
    size = "md",
    tooltipLabel,
    disabledReason = null,
    loading = false,
    preferAnimated = true,
    className,
    disabled = false,
    type = "button",
    onClick,
    ...rest
  }: IconButtonProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const isDisabled = disabled || loading || disabledReason !== null;
  const tooltip = resolveTooltipLabel(disabledReason, tooltipLabel);

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  const button = (
    <button
      ref={ref}
      type={type}
      className={clsx(
        styles.iconButton,
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      onClick={handleClick}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <AppIcon
          id={iconId}
          decorative
          preferAnimated={preferAnimated}
          size={ICON_PIXEL_SIZE[size]}
        />
      )}
    </button>
  );

  return <IconTooltip label={tooltip}>{button}</IconTooltip>;
});
