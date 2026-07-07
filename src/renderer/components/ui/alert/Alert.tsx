import clsx from "clsx";
import {
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import type { AlertVariant } from "../types.js";
import styles from "./Alert.module.css";

export type AlertProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    variant?: AlertVariant;
    className?: string;
    children?: ReactNode;
  }
>;

export type AlertTitleProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type AlertDescriptionProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type AlertActionProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

const VARIANT_CLASS: Record<AlertVariant, string> = {
  default: styles.variantDefault ?? "",
  destructive: styles.variantDestructive ?? "",
};

/**
 * - Purpose: inline callout surface with alert semantics and composable slots.
 * - Inputs: variant, native div props, and child title, description, icon, or action slots.
 * - Outputs: static bordered alert region with role="alert".
 */
export const Alert = forwardRef(function Alert(
  { variant = "default", className, children, ...rest }: AlertProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      role="alert"
      className={clsx(styles.root, VARIANT_CLASS[variant], className)}
      data-variant={variant}
    >
      {children}
    </div>
  );
});

/**
 * - Purpose: primary alert heading with compact emphasis styling.
 * - Inputs: native div props and title copy.
 * - Outputs: alert title slot aligned to the content column.
 */
export const AlertTitle = forwardRef(function AlertTitle(
  { className, children, ...rest }: AlertTitleProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div ref={ref} {...rest} className={clsx(styles.title, className)}>
      {children}
    </div>
  );
});

/**
 * - Purpose: secondary alert copy with muted tone and relaxed line height.
 * - Inputs: native div props and description copy.
 * - Outputs: alert description slot below the title.
 */
export const AlertDescription = forwardRef(function AlertDescription(
  { className, children, ...rest }: AlertDescriptionProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div ref={ref} {...rest} className={clsx(styles.description, className)}>
      {children}
    </div>
  );
});

/**
 * - Purpose: trailing action slot for buttons or other inline controls.
 * - Inputs: native div props and action control children.
 * - Outputs: right-aligned action row that does not capture root focus.
 */
export const AlertAction = forwardRef(function AlertAction(
  { className, children, ...rest }: AlertActionProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div ref={ref} {...rest} className={clsx(styles.action, className)}>
      {children}
    </div>
  );
});
