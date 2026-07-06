import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { resolveIconTooltipDelayMs } from "../../icons/iconTooltipDelay.js";
import styles from "./Tooltip.module.css";

export type TooltipProviderProps = Readonly<
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>
>;

export type TooltipRootProps = Readonly<ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>>;

export type TooltipTriggerProps = Readonly<
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>;

export type TooltipContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, "className"> & {
    className?: string;
    side?: "top" | "right" | "bottom" | "left";
  }
>;

export type TooltipProps = Readonly<{
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}>;

function hasTooltipLabel(label: ReactNode): boolean {
  if (label === null || label === undefined || label === false) {
    return false;
  }

  if (typeof label === "string") {
    return label.length > 0;
  }

  return true;
}

function resolveTooltipDelay(delayDuration: number | undefined): number {
  return delayDuration ?? resolveIconTooltipDelayMs();
}

/**
 * - Purpose: configures shared tooltip open delay and skip-delay behavior.
 * - Inputs: optional delayDuration, skipDelayDuration, and Radix provider props.
 * - Outputs: tooltip timing context for nested tooltip roots.
 */
export function TooltipProvider({
  delayDuration,
  skipDelayDuration,
  ...rest
}: TooltipProviderProps): JSX.Element {
  const resolvedDelay = resolveTooltipDelay(delayDuration);

  return (
    <TooltipPrimitive.Provider
      {...rest}
      delayDuration={resolvedDelay}
      skipDelayDuration={skipDelayDuration ?? resolvedDelay}
    />
  );
}

/**
 * - Purpose: tooltip root with optional controlled open state.
 * - Inputs: open state props, delayDuration override, and tooltip children.
 * - Outputs: Radix tooltip context for trigger and content.
 */
export function TooltipRoot({
  delayDuration,
  ...rest
}: TooltipRootProps): JSX.Element {
  const resolvedDelay = resolveTooltipDelay(delayDuration);

  return <TooltipPrimitive.Root {...rest} delayDuration={resolvedDelay} />;
}

/**
 * - Purpose: focusable trigger that opens the tooltip on hover and focus.
 * - Inputs: Radix trigger props and child element via asChild.
 * - Outputs: accessible trigger wired to tooltip content.
 */
export const TooltipTrigger = forwardRef(function TooltipTrigger(
  { ...rest }: TooltipTriggerProps,
  ref: Ref<ComponentRef<typeof TooltipPrimitive.Trigger>>,
): JSX.Element {
  return <TooltipPrimitive.Trigger ref={ref} {...rest} />;
});

/**
 * - Purpose: portaled tooltip bubble with placement and overlay tokens.
 * - Inputs: side, sideOffset, className, and Radix content props.
 * - Outputs: styled tooltip surface with semantic elevation tokens.
 */
export const TooltipContent = forwardRef(function TooltipContent(
  {
    className,
    side = "top",
    sideOffset = 4,
    ...rest
  }: TooltipContentProps,
  ref: Ref<ComponentRef<typeof TooltipPrimitive.Content>>,
): JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        className={clsx(styles.content, className)}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
});

/**
 * - Purpose: convenience tooltip wrapper for short assistive labels.
 * - Inputs: label, side, delayDuration, disabled flag, and single child trigger.
 * - Outputs: provider-backed tooltip or passthrough children when disabled.
 */
export function Tooltip({
  label,
  side = "top",
  delayDuration,
  disabled = false,
  children,
  className,
}: TooltipProps): JSX.Element {
  if (disabled || !hasTooltipLabel(label)) {
    return <>{children}</>;
  }

  const resolvedDelay = resolveTooltipDelay(delayDuration);

  return (
    <TooltipProvider delayDuration={resolvedDelay} skipDelayDuration={resolvedDelay}>
      <TooltipRoot delayDuration={resolvedDelay}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} {...(className !== undefined ? { className } : {})}>
          {label}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
