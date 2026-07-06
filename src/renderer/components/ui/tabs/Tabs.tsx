import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import styles from "./Tabs.module.css";

export type TabsProps = Readonly<ComponentPropsWithoutRef<typeof TabsPrimitive.Root>>;

export type TabsListProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.List>, "className"> & {
    className?: string;
  }
>;

export type TabsTriggerProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, "className"> & {
    className?: string;
  }
>;

export type TabsContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Content>, "className"> & {
    className?: string;
  }
>;

/**
 * - Purpose: composable tab panel root with optional controlled active value.
 * - Inputs: value/defaultValue, onValueChange, orientation, activationMode.
 * - Outputs: tab context for list, triggers, and associated content panels.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  activationMode,
  ...rest
}: TabsProps): JSX.Element {
  return (
    <TabsPrimitive.Root
      {...rest}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onValueChange !== undefined ? { onValueChange } : {})}
      orientation={orientation}
      {...(activationMode !== undefined ? { activationMode } : {})}
    />
  );
}

/**
 * - Purpose: roving-focus tab strip hosting trigger buttons.
 * - Inputs: className and Radix list props including loop and aria-label.
 * - Outputs: styled tab list with orientation-aware layout.
 */
export const TabsList = forwardRef(function TabsList(
  { className, ...rest }: TabsListProps,
  ref: Ref<ComponentRef<typeof TabsPrimitive.List>>,
): JSX.Element {
  return (
    <TabsPrimitive.List ref={ref} className={clsx(styles.list, className)} {...rest} />
  );
});

/**
 * - Purpose: selectable tab trigger bound to a content panel value.
 * - Inputs: value, disabled, className, and Radix trigger props.
 * - Outputs: accessible tab button with active and disabled styling.
 */
export const TabsTrigger = forwardRef(function TabsTrigger(
  { className, disabled = false, ...rest }: TabsTriggerProps,
  ref: Ref<ComponentRef<typeof TabsPrimitive.Trigger>>,
): JSX.Element {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={clsx(styles.trigger, className)}
      {...rest}
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
    />
  );
});

/**
 * - Purpose: panel region shown when its trigger value is active.
 * - Inputs: value, forceMount, className, and Radix content props.
 * - Outputs: focusable tab panel with semantic content region styling.
 */
export const TabsContent = forwardRef(function TabsContent(
  { className, ...rest }: TabsContentProps,
  ref: Ref<ComponentRef<typeof TabsPrimitive.Content>>,
): JSX.Element {
  return (
    <TabsPrimitive.Content ref={ref} className={clsx(styles.content, className)} {...rest} />
  );
});
