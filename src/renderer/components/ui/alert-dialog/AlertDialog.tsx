import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import styles from "./AlertDialog.module.css";

export type AlertDialogProps = Readonly<
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>
>;

export type AlertDialogTriggerProps = Readonly<
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger>
>;

export type AlertDialogContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>, "className"> & {
    className?: string;
    /** Optional class on the scrim overlay (e.g. product blur). */
    overlayClassName?: string;
  }
>;

export type AlertDialogHeaderProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

export type AlertDialogTitleProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>, "className"> & {
    className?: string;
  }
>;

export type AlertDialogDescriptionProps = Readonly<
  Omit<
    ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>,
    "className"
  > & {
    className?: string;
  }
>;

export type AlertDialogFooterProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

export type AlertDialogActionProps = Readonly<
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>;

export type AlertDialogCancelProps = Readonly<
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>;

/**
 * - Purpose: blocking confirmation root with optional controlled open state.
 * - Inputs: Radix root props including open, defaultOpen, and onOpenChange.
 * - Outputs: alert dialog context for trigger, content, and action slots.
 */
export function AlertDialog(props: AlertDialogProps): JSX.Element {
  return <AlertDialogPrimitive.Root {...props} />;
}

/**
 * - Purpose: opens alert dialog content from a focusable trigger element.
 * - Inputs: Radix trigger props and child trigger element via asChild.
 * - Outputs: accessible alert dialog trigger with expanded state.
 */
export const AlertDialogTrigger = forwardRef(function AlertDialogTrigger(
  { ...rest }: AlertDialogTriggerProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Trigger>>,
): JSX.Element {
  return <AlertDialogPrimitive.Trigger ref={ref} {...rest} />;
});

/**
 * - Purpose: portaled blocking surface with overlay and focus trap.
 * - Inputs: className and Radix alert dialog content props.
 * - Outputs: focus-trapped alert dialog panel with scrim overlay and motion tokens.
 */
export const AlertDialogContent = forwardRef(function AlertDialogContent(
  {
    className,
    overlayClassName,
    children,
    onOpenAutoFocus,
    onCloseAutoFocus,
    ...rest
  }: AlertDialogContentProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Content>>,
): JSX.Element {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className={clsx(styles.overlay, overlayClassName)} />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={clsx(styles.content, className)}
        {...rest}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
});

/**
 * - Purpose: groups alert dialog title and description with consistent spacing.
 * - Inputs: optional className and header children.
 * - Outputs: stacked header region inside alert dialog content.
 */
export function AlertDialogHeader({ className, children }: AlertDialogHeaderProps): JSX.Element {
  return <div className={clsx(styles.header, className)}>{children}</div>;
}

/**
 * - Purpose: accessible alert dialog title wired to Radix alert semantics.
 * - Inputs: title text children and optional className.
 * - Outputs: Radix title element exposing the alert dialog accessible name.
 */
export const AlertDialogTitle = forwardRef(function AlertDialogTitle(
  { className, ...rest }: AlertDialogTitleProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Title>>,
): JSX.Element {
  return (
    <AlertDialogPrimitive.Title ref={ref} className={clsx(styles.title, className)} {...rest} />
  );
});

/**
 * - Purpose: optional alert dialog description linked to the title region.
 * - Inputs: description text children and optional className.
 * - Outputs: Radix description element for supplementary alert copy.
 */
export const AlertDialogDescription = forwardRef(function AlertDialogDescription(
  { className, ...rest }: AlertDialogDescriptionProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Description>>,
): JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={clsx(styles.description, className)}
      {...rest}
    />
  );
});

/**
 * - Purpose: action row aligned to the alert dialog footer edge.
 * - Inputs: optional className and footer action children.
 * - Outputs: flex footer container for cancel and confirm actions.
 */
export function AlertDialogFooter({ className, children }: AlertDialogFooterProps): JSX.Element {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}

/**
 * - Purpose: confirms the alert decision and closes the dialog on activation.
 * - Inputs: Radix action props and optional asChild confirm button.
 * - Outputs: focus-safe confirm control participating in alert dialog lifecycle.
 */
export const AlertDialogAction = forwardRef(function AlertDialogAction(
  { ...rest }: AlertDialogActionProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Action>>,
): JSX.Element {
  return <AlertDialogPrimitive.Action ref={ref} {...rest} />;
});

/**
 * - Purpose: cancels the alert decision and closes the dialog on activation.
 * - Inputs: Radix cancel props and optional asChild dismiss button.
 * - Outputs: focus-safe cancel control participating in alert dialog lifecycle.
 */
export const AlertDialogCancel = forwardRef(function AlertDialogCancel(
  { ...rest }: AlertDialogCancelProps,
  ref: Ref<ComponentRef<typeof AlertDialogPrimitive.Cancel>>,
): JSX.Element {
  return <AlertDialogPrimitive.Cancel ref={ref} {...rest} />;
});
