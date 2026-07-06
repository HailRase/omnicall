import clsx from "clsx";
import {
  forwardRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import type { ControlSize } from "../types.js";
import styles from "./Input.module.css";

export type InputProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
    size?: ControlSize;
    invalid?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
    className?: string;
  }
>;

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

/**
 * - Purpose: reusable text input with sizes, invalid state, and optional affixes.
 * - Inputs: size, invalid, prefix, suffix, native input props.
 * - Outputs: accessible textbox with visual and ARIA state.
 */
export const Input = forwardRef(function Input(
  {
    size = "md",
    invalid = false,
    prefix,
    suffix,
    className,
    disabled = false,
    readOnly = false,
    onChange,
    type = "text",
    ...rest
  }: InputProps,
  ref: Ref<HTMLInputElement>,
): JSX.Element {
  const hasAffixes = prefix != null || suffix != null;

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onChange?.(event);
  }

  const inputElement = (
    <input
      ref={ref}
      type={type}
      className={clsx(
        styles.input,
        SIZE_CLASS[size],
        hasAffixes && styles.inputInGroup,
        className,
      )}
      {...rest}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      onChange={handleChange}
    />
  );

  if (!hasAffixes) {
    return inputElement;
  }

  return (
    <div
      className={clsx(styles.group, SIZE_CLASS[size])}
      data-disabled={disabled ? "true" : undefined}
      data-invalid={invalid ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
    >
      {prefix != null ? (
        <span className={styles.affix} data-affix="prefix">
          {prefix}
        </span>
      ) : null}
      {inputElement}
      {suffix != null ? (
        <span className={styles.affix} data-affix="suffix">
          {suffix}
        </span>
      ) : null}
    </div>
  );
});
