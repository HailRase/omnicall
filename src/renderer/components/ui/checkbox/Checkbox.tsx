import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import styles from "./Checkbox.module.css";

export type CheckboxProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "className"> & {
    invalid?: boolean;
    className?: string;
  }
>;

/**
 * - Purpose: accessible boolean checkbox with checked, indeterminate, invalid, and disabled states.
 * - Inputs: checked, defaultChecked, onCheckedChange, invalid, disabled, native Radix props.
 * - Outputs: Radix checkbox button with semantic visual state and indicator.
 */
export const Checkbox = forwardRef(function Checkbox(
  {
    className,
    invalid = false,
    disabled = false,
    onCheckedChange,
    ...rest
  }: CheckboxProps,
  ref: Ref<ComponentRef<typeof CheckboxPrimitive.Root>>,
): JSX.Element {
  function handleCheckedChange(checked: boolean | "indeterminate"): void {
    if (disabled) {
      return;
    }
    onCheckedChange?.(checked);
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={clsx(styles.root, className)}
      {...rest}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
      onCheckedChange={handleCheckedChange}
    >
      <CheckboxPrimitive.Indicator className={styles.indicator}>
        <AppIcon id="action.confirm" decorative size={12} className={styles.checkIcon} />
        <span className={styles.indeterminateBar} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
