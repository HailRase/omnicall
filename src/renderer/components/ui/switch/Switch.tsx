import * as SwitchPrimitive from "@radix-ui/react-switch";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import styles from "./Switch.module.css";

export type SwitchProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, "className"> & {
    className?: string;
  }
>;

/**
 * - Purpose: accessible on/off toggle with Radix switch semantics.
 * - Inputs: checked state props, disabled, className, and Radix root props.
 * - Outputs: switch control with checked visuals and onCheckedChange callbacks.
 */
export const Switch = forwardRef(function Switch(
  {
    className,
    disabled = false,
    onCheckedChange,
    ...rest
  }: SwitchProps,
  ref: Ref<ComponentRef<typeof SwitchPrimitive.Root>>,
): JSX.Element {
  function handleCheckedChange(checked: boolean): void {
    if (disabled) {
      return;
    }

    onCheckedChange?.(checked);
  }

  return (
    <SwitchPrimitive.Root
      className={clsx(styles.switch, className)}
      {...rest}
      ref={ref}
      disabled={disabled}
      onCheckedChange={handleCheckedChange}
    >
      <SwitchPrimitive.Thumb className={styles.thumb} />
    </SwitchPrimitive.Root>
  );
});
