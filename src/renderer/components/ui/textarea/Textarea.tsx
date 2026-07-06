import clsx from "clsx";
import {
  forwardRef,
  type ChangeEvent,
  type JSX,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import type { ControlSize, TextareaResize } from "../types.js";
import styles from "./Textarea.module.css";

export type TextareaProps = Readonly<
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "size"> & {
    size?: ControlSize;
    invalid?: boolean;
    resize?: TextareaResize;
    className?: string;
  }
>;

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

const RESIZE_CLASS: Record<TextareaResize, string> = {
  none: styles.resizeNone ?? "",
  vertical: styles.resizeVertical ?? "",
};

/**
 * - Purpose: reusable multiline text entry with sizes, invalid state, and resize policy.
 * - Inputs: size, invalid, resize, native textarea props.
 * - Outputs: accessible multiline textbox with visual and ARIA state.
 */
export const Textarea = forwardRef(function Textarea(
  {
    size = "md",
    invalid = false,
    resize = "vertical",
    className,
    disabled = false,
    readOnly = false,
    onChange,
    ...rest
  }: TextareaProps,
  ref: Ref<HTMLTextAreaElement>,
): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onChange?.(event);
  }

  return (
    <textarea
      ref={ref}
      className={clsx(
        styles.textarea,
        SIZE_CLASS[size],
        RESIZE_CLASS[resize],
        className,
      )}
      {...rest}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      data-resize={resize}
      onChange={handleChange}
    />
  );
});
