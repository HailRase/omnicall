import clsx from "clsx";
import {
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type Ref,
} from "react";
import type { ControlSize } from "../types.js";
import styles from "./Spinner.module.css";

export type SpinnerProps = Readonly<
  Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
    size?: ControlSize;
    label?: string;
    decorative?: boolean;
    className?: string;
  }
>;

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

/**
 * - Purpose: inline loading indicator with size variants and accessible status semantics.
 * - Inputs: size, optional label, decorative flag, and native span props.
 * - Outputs: fixed-size spinner surface for buttons, forms, and inline loading states.
 */
export const Spinner = forwardRef(function Spinner(
  {
    size = "md",
    label,
    decorative = false,
    className,
    ...rest
  }: SpinnerProps,
  ref: Ref<HTMLSpanElement>,
): JSX.Element {
  return (
    <span
      ref={ref}
      className={clsx(styles.root, SIZE_CLASS[size], className)}
      {...rest}
      role={decorative ? undefined : "status"}
      aria-live={decorative ? undefined : "polite"}
      aria-hidden={decorative ? true : undefined}
      aria-label={!decorative && label !== undefined ? label : undefined}
      data-decorative={decorative ? "true" : undefined}
      data-size={size}
    >
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  );
});
