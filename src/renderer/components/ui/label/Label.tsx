import clsx from "clsx";
import {
  forwardRef,
  type JSX,
  type LabelHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import styles from "./Label.module.css";

export type LabelProps = Readonly<
  Omit<LabelHTMLAttributes<HTMLLabelElement>, "className"> & {
    required?: boolean;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: accessible form label with consistent typography and required/disabled visuals.
 * - Inputs: required, disabled, native label props, children.
 * - Outputs: label element associated with controls through htmlFor.
 */
export const Label = forwardRef(function Label(
  {
    required = false,
    disabled = false,
    className,
    children,
    ...rest
  }: LabelProps,
  ref: Ref<HTMLLabelElement>,
): JSX.Element {
  return (
    <label
      ref={ref}
      className={clsx(styles.label, className)}
      {...rest}
      data-disabled={disabled ? "true" : undefined}
      data-required={required ? "true" : undefined}
    >
      {children}
      {required ? (
        <span className={styles.requiredMarker} aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});
