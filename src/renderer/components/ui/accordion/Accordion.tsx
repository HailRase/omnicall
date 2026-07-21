import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import styles from "./Accordion.module.css";

type AccordionSingleRootProps = Extract<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>,
  { type: "single" }
>;
type AccordionMultipleRootProps = Extract<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>,
  { type: "multiple" }
>;

export type AccordionProps = Readonly<
  | (Omit<AccordionSingleRootProps, "className"> & { className?: string })
  | (Omit<AccordionMultipleRootProps, "className"> & { className?: string })
>;

export type AccordionItemProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>, "className"> & {
    className?: string;
  }
>;

export type AccordionTriggerProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>, "className"> & {
    className?: string;
  }
>;

export type AccordionContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>, "className"> & {
    className?: string;
  }
>;

/**
 * - Purpose: composable accordion root with single/multiple open modes.
 * - Inputs: type, value/defaultValue, collapsible, disabled, orientation, className.
 * - Outputs: accessible accordion context for items, triggers, and content panels.
 */
export function Accordion(props: AccordionProps): JSX.Element {
  const { className, disabled = false, ...rest } = props;

  if (rest.type === "multiple") {
    return (
      <AccordionPrimitive.Root
        className={clsx(styles.root, className)}
        data-slot="accordion"
        {...rest}
        disabled={disabled}
        data-disabled={disabled ? "true" : undefined}
      />
    );
  }

  return (
    <AccordionPrimitive.Root
      className={clsx(styles.root, className)}
      data-slot="accordion"
      {...rest}
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
    />
  );
}

/**
 * - Purpose: one collapsible section bound to a unique value.
 * - Inputs: value, disabled, className, and Radix item props.
 * - Outputs: styled accordion section with open/closed data-state.
 */
export const AccordionItem = forwardRef(function AccordionItem(
  { className, disabled = false, ...rest }: AccordionItemProps,
  ref: Ref<ComponentRef<typeof AccordionPrimitive.Item>>,
): JSX.Element {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={clsx(styles.item, className)}
      data-slot="accordion-item"
      {...rest}
      {...(disabled ? { disabled: true } : {})}
      data-disabled={disabled ? "true" : undefined}
    />
  );
});

/**
 * - Purpose: header button that expands or collapses its accordion item.
 * - Inputs: children label, disabled, className, and Radix trigger props.
 * - Outputs: accessible trigger with decorative chevron indicator.
 */
export const AccordionTrigger = forwardRef(function AccordionTrigger(
  { className, children, disabled, ...rest }: AccordionTriggerProps,
  ref: Ref<ComponentRef<typeof AccordionPrimitive.Trigger>>,
): JSX.Element {
  return (
    <AccordionPrimitive.Header className={styles.header} data-slot="accordion-header">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={clsx(styles.trigger, className)}
        data-slot="accordion-trigger"
        {...rest}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(disabled === true ? { "data-disabled": "true" as const } : {})}
      >
        {children}
        <span className={styles.chevron} aria-hidden="true" data-slot="accordion-chevron">
          <AppIcon id="ui.select.chevron" decorative size={16} />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

/**
 * - Purpose: collapsible panel shown when its accordion item is open.
 * - Inputs: children, forceMount, className, and Radix content props.
 * - Outputs: animated content region with semantic secondary text styling.
 */
export const AccordionContent = forwardRef(function AccordionContent(
  { className, children, ...rest }: AccordionContentProps,
  ref: Ref<ComponentRef<typeof AccordionPrimitive.Content>>,
): JSX.Element {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={clsx(styles.content, className)}
      data-slot="accordion-content"
      {...rest}
    >
      <div className={styles.contentInner} data-slot="accordion-content-inner">
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
