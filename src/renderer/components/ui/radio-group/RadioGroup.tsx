import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import type { RadioGroupOrientation } from "../types.js";
import styles from "./RadioGroup.module.css";

export type { RadioGroupOrientation };

export type RadioGroupProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, "className"> & {
    className?: string;
    orientation?: RadioGroupOrientation;
  }
>;

export type RadioGroupItemProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, "className"> & {
    className?: string;
    invalid?: boolean;
  }
>;

/**
 * - Purpose: mutually exclusive radio option set with Radix keyboard semantics.
 * - Inputs: value/defaultValue, onValueChange, disabled, orientation, className.
 * - Outputs: radiogroup root hosting RadioGroupItem children.
 */
export const RadioGroup = forwardRef(function RadioGroup(
  {
    className,
    disabled = false,
    orientation = "vertical",
    onValueChange,
    ...rest
  }: RadioGroupProps,
  ref: Ref<ComponentRef<typeof RadioGroupPrimitive.Root>>,
): JSX.Element {
  function handleValueChange(nextValue: string): void {
    if (disabled) {
      return;
    }
    onValueChange?.(nextValue);
  }

  return (
    <RadioGroupPrimitive.Root
      className={clsx(styles.root, className)}
      {...rest}
      ref={ref}
      disabled={disabled}
      orientation={orientation}
      data-orientation={orientation}
      onValueChange={handleValueChange}
    />
  );
});

/**
 * - Purpose: single radio option with checked indicator.
 * - Inputs: value, disabled, invalid, className, Radix item props.
 * - Outputs: accessible radio button with filled indicator when checked.
 */
export const RadioGroupItem = forwardRef(function RadioGroupItem(
  {
    className,
    disabled = false,
    invalid = false,
    ...rest
  }: RadioGroupItemProps,
  ref: Ref<ComponentRef<typeof RadioGroupPrimitive.Item>>,
): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={clsx(styles.item, className)}
      {...rest}
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
    >
      <RadioGroupPrimitive.Indicator className={styles.indicator} />
    </RadioGroupPrimitive.Item>
  );
});
