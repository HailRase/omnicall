import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import type { ControlSize } from "../types.js";
import styles from "./Select.module.css";

export type SelectItemOption = Readonly<{
  value: string;
  label: ReactNode;
  disabled?: boolean;
}>;

export type SelectProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, "children"> & {
    items: readonly SelectItemOption[];
    size?: ControlSize;
    placeholder?: ReactNode;
    invalid?: boolean;
    className?: string;
    contentClassName?: string;
    id?: string;
    "data-testid"?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }
>;

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

/**
 * - Purpose: single-value select with Radix keyboard navigation and popover styling.
 * - Inputs: items, value/defaultValue, placeholder, size, disabled, invalid, aria props.
 * - Outputs: accessible combobox trigger and portaled option list with selected value.
 */
export const Select = forwardRef(function Select(
  {
    items,
    size = "md",
    placeholder,
    invalid = false,
    className,
    contentClassName,
    disabled = false,
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
    "data-testid": testId,
    ...rest
  }: SelectProps,
  ref: Ref<ComponentRef<typeof SelectPrimitive.Trigger>>,
): JSX.Element {
  function handleValueChange(nextValue: string): void {
    if (disabled) {
      return;
    }
    onValueChange?.(nextValue);
  }

  const placeholderText = typeof placeholder === "string" ? placeholder : undefined;

  return (
    <SelectPrimitive.Root
      {...rest}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(open !== undefined ? { open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      disabled={disabled}
      {...(onOpenChange !== undefined ? { onOpenChange } : {})}
      onValueChange={handleValueChange}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        data-testid={testId}
        className={clsx(styles.trigger, SIZE_CLASS[size], className)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={invalid || undefined}
        data-invalid={invalid ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
      >
        <SelectPrimitive.Value placeholder={placeholderText} className={styles.value} />
        <SelectPrimitive.Icon asChild>
          <span className={styles.icon} aria-hidden="true">
            <AppIcon id="ui.select.chevron" decorative size={16} />
          </span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={clsx(styles.content, contentClassName)}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className={styles.viewport}>
            {items.map((item) => (
              <SelectPrimitive.Item
                key={item.value}
                value={item.value}
                {...(item.disabled === true ? { disabled: true } : {})}
                className={styles.item}
                data-disabled={item.disabled ? "true" : undefined}
              >
                <SelectPrimitive.ItemText className={styles.itemText}>
                  {item.label}
                </SelectPrimitive.ItemText>
                <span className={styles.itemIndicator}>
                  <SelectPrimitive.ItemIndicator>
                    <AppIcon id="action.confirm" decorative size={16} />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
