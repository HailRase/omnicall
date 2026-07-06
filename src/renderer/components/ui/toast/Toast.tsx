import * as ToastPrimitive from "@radix-ui/react-toast";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "../button/Button.js";
import { IconButton } from "../icon-button/IconButton.js";
import type { ToastPlacement, ToastTone } from "../types.js";
import styles from "./Toast.module.css";

export type ToastProviderProps = Readonly<
  ComponentPropsWithoutRef<typeof ToastPrimitive.Provider>
>;

export type ToastViewportProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>, "className"> & {
    className?: string;
    placement?: ToastPlacement;
  }
>;

export type ToastRootProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, "className" | "type"> & {
    className?: string;
    tone?: ToastTone;
    type?: "foreground" | "background";
  }
>;

export type ToastTitleProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Title>, "className"> & {
    className?: string;
  }
>;

export type ToastDescriptionProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Description>, "className"> & {
    className?: string;
  }
>;

export type ToastActionProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Action>, "className" | "altText"> & {
    className?: string;
    altText: string;
    children: ReactNode;
  }
>;

export type ToastCloseProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Close>, "className"> & {
    className?: string;
    closeLabel: string;
  }
>;

const PLACEMENT_CLASS: Record<ToastPlacement, string> = {
  "top-right": styles.viewportTopRight ?? "",
  "top-left": styles.viewportTopLeft ?? "",
  "bottom-right": styles.viewportBottomRight ?? "",
  "bottom-left": styles.viewportBottomLeft ?? "",
};

const TONE_CLASS: Record<ToastTone, string> = {
  default: styles.toneDefault ?? "",
  success: styles.toneSuccess ?? "",
  warning: styles.toneWarning ?? "",
  destructive: styles.toneDestructive ?? "",
  info: styles.toneInfo ?? "",
};

function resolveToastType(
  tone: ToastTone,
  type: ToastRootProps["type"],
): "foreground" | "background" {
  if (type !== undefined) {
    return type;
  }

  return tone === "destructive" ? "foreground" : "background";
}

/**
 * - Purpose: configures shared toast duration, swipe behavior, and announcements.
 * - Inputs: optional duration, label, swipeDirection, and Radix provider props.
 * - Outputs: toast timing context for viewport and toast roots.
 */
export function ToastProvider({ ...rest }: ToastProviderProps): JSX.Element {
  return <ToastPrimitive.Provider {...rest} />;
}

/**
 * - Purpose: fixed viewport that stacks toast surfaces with placement variants.
 * - Inputs: placement, className, and Radix viewport props.
 * - Outputs: accessible toast list region with keyboard hotkey support.
 */
export const ToastViewport = forwardRef(function ToastViewport(
  {
    className,
    placement = "bottom-right",
    ...rest
  }: ToastViewportProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Viewport>>,
): JSX.Element {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      {...rest}
      className={clsx(styles.viewport, PLACEMENT_CLASS[placement], className)}
    />
  );
});

/**
 * - Purpose: individual toast root with tone styling and optional duration override.
 * - Inputs: tone, duration, open state props, and toast slot children.
 * - Outputs: dismissible toast surface wired to Radix lifecycle events.
 */
export const ToastRoot = forwardRef(function ToastRoot(
  {
    className,
    tone = "default",
    type,
    children,
    duration,
    ...rest
  }: ToastRootProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Root>>,
): JSX.Element {
  const resolvedType = resolveToastType(tone, type);

  return (
    <ToastPrimitive.Root
      ref={ref}
      {...rest}
      className={clsx(styles.root, TONE_CLASS[tone], className)}
      data-tone={tone}
      type={resolvedType}
      {...(duration !== undefined ? { duration } : {})}
    >
      {children}
    </ToastPrimitive.Root>
  );
});

/**
 * - Purpose: semibold toast title text linked to the toast announcement.
 * - Inputs: title copy children and optional className.
 * - Outputs: Radix title element for the toast accessible name.
 */
export const ToastTitle = forwardRef(function ToastTitle(
  { className, ...rest }: ToastTitleProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Title>>,
): JSX.Element {
  return (
    <ToastPrimitive.Title ref={ref} className={clsx(styles.title, className)} {...rest} />
  );
});

/**
 * - Purpose: secondary toast description linked to the title region.
 * - Inputs: description copy children and optional className.
 * - Outputs: Radix description element for supplementary toast copy.
 */
export const ToastDescription = forwardRef(function ToastDescription(
  { className, ...rest }: ToastDescriptionProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Description>>,
): JSX.Element {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={clsx(styles.description, className)}
      {...rest}
    />
  );
});

/**
 * - Purpose: optional toast action rendered with UI Kit button styling.
 * - Inputs: altText, action label children, and Radix action props.
 * - Outputs: accessible action button that keeps focus inside the toast.
 */
export const ToastAction = forwardRef(function ToastAction(
  { className, altText, children, ...rest }: ToastActionProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Action>>,
): JSX.Element {
  return (
    <ToastPrimitive.Action ref={ref} altText={altText} asChild {...rest}>
      <Button variant="outline" size="sm" className={clsx(styles.action, className)}>
        {children}
      </Button>
    </ToastPrimitive.Action>
  );
});

/**
 * - Purpose: dismiss control for a toast using the UI Kit icon button.
 * - Inputs: closeLabel for accessibility and optional className.
 * - Outputs: Radix close control with ghost icon button visuals.
 */
export const ToastClose = forwardRef(function ToastClose(
  { className, closeLabel, ...rest }: ToastCloseProps,
  ref: Ref<ComponentRef<typeof ToastPrimitive.Close>>,
): JSX.Element {
  return (
    <ToastPrimitive.Close asChild {...rest}>
      <IconButton
        ref={ref}
        iconId="overlay.close"
        ariaLabel={closeLabel}
        variant="ghost"
        size="sm"
        className={clsx(styles.closeButton, className)}
      />
    </ToastPrimitive.Close>
  );
});
