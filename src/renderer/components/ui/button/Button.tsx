import clsx from "clsx";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type JSX,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { ButtonSize, ButtonVariant } from "../types.js";
import styles from "./Button.module.css";

export type ButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary ?? "",
  secondary: styles.variantSecondary ?? "",
  outline: styles.variantOutline ?? "",
  ghost: styles.variantGhost ?? "",
  destructive: styles.variantDestructive ?? "",
  link: styles.variantLink ?? "",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
  icon: styles.sizeIcon ?? "",
};

/**
 * - Purpose: reusable action button with variants, sizes, loading, and full-width layout.
 * - Inputs: variant, size, loading, fullWidth, native button props, children.
 * - Outputs: accessible button element with visual state and click callbacks.
 */
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled = false,
    type = "button",
    onClick,
    ...rest
  }: ButtonProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const isDisabled = disabled || loading;

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        styles.button,
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      onClick={handleClick}
    >
      {loading ? (
        <span className={styles.loadingContent}>
          <span className={styles.spinner} aria-hidden="true" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});
