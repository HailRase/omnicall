import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { IconButton } from "../icon-button/IconButton.js";
import type { DialogSize } from "../types.js";
import styles from "./Dialog.module.css";

export type DialogProps = Readonly<ComponentPropsWithoutRef<typeof DialogPrimitive.Root>>;

export type DialogTriggerProps = Readonly<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>;

export type DialogContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "className"> & {
    className?: string;
    overlayClassName?: string;
    size?: DialogSize;
    closeLabel: string;
    showCloseButton?: boolean;
  }
>;

export type DialogHeaderProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

export type DialogTitleProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Title>, "className"> & {
    className?: string;
  }
>;

export type DialogDescriptionProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Description>, "className"> & {
    className?: string;
  }
>;

export type DialogFooterProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

export type DialogCloseProps = Readonly<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>;

const SIZE_CLASS: Record<DialogSize, string> = {
  sm: styles.contentSizeSm ?? "",
  md: styles.contentSizeMd ?? "",
  lg: styles.contentSizeLg ?? "",
  fullscreen: styles.contentSizeFullscreen ?? "",
};

/**
 * - Purpose: composable modal dialog root with optional controlled open state.
 * - Inputs: Radix root props including open, defaultOpen, onOpenChange, modal.
 * - Outputs: dialog context for trigger, content, title, and footer slots.
 */
export function Dialog(props: DialogProps): JSX.Element {
  return <DialogPrimitive.Root {...props} />;
}

/**
 * - Purpose: opens dialog content from a focusable trigger element.
 * - Inputs: Radix trigger props and child trigger element via asChild.
 * - Outputs: accessible dialog trigger with expanded state.
 */
export const DialogTrigger = forwardRef(function DialogTrigger(
  { ...rest }: DialogTriggerProps,
  ref: Ref<ComponentRef<typeof DialogPrimitive.Trigger>>,
): JSX.Element {
  return <DialogPrimitive.Trigger ref={ref} {...rest} />;
});

/**
 * - Purpose: portaled modal surface with overlay, size variants, and close control.
 * - Inputs: size, closeLabel, showCloseButton, className, and Radix content props.
 * - Outputs: focus-trapped dialog panel with scrim overlay and motion tokens.
 */
export const DialogContent = forwardRef(function DialogContent(
  {
    className,
    overlayClassName,
    size = "md",
    closeLabel,
    showCloseButton = true,
    children,
    onOpenAutoFocus,
    onCloseAutoFocus,
    ...rest
  }: DialogContentProps,
  ref: Ref<ComponentRef<typeof DialogPrimitive.Content>>,
): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={clsx(styles.overlay, overlayClassName)} />
      <DialogPrimitive.Content
        ref={ref}
        className={clsx(styles.content, SIZE_CLASS[size], className)}
        {...rest}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <IconButton
              iconId="overlay.close"
              ariaLabel={closeLabel}
              variant="ghost"
              size="sm"
              className={styles.closeButton}
            />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/**
 * - Purpose: groups dialog title and description with consistent spacing.
 * - Inputs: optional className and header children.
 * - Outputs: stacked header region inside dialog content.
 */
export function DialogHeader({ className, children }: DialogHeaderProps): JSX.Element {
  return <div className={clsx(styles.header, className)}>{children}</div>;
}

/**
 * - Purpose: accessible dialog title wired to Radix dialog semantics.
 * - Inputs: title text children and optional className.
 * - Outputs: Radix title element exposing the dialog accessible name.
 */
export const DialogTitle = forwardRef(function DialogTitle(
  { className, ...rest }: DialogTitleProps,
  ref: Ref<ComponentRef<typeof DialogPrimitive.Title>>,
): JSX.Element {
  return (
    <DialogPrimitive.Title ref={ref} className={clsx(styles.title, className)} {...rest} />
  );
});

/**
 * - Purpose: optional dialog description linked to the title region.
 * - Inputs: description text children and optional className.
 * - Outputs: Radix description element for supplementary dialog copy.
 */
export const DialogDescription = forwardRef(function DialogDescription(
  { className, ...rest }: DialogDescriptionProps,
  ref: Ref<ComponentRef<typeof DialogPrimitive.Description>>,
): JSX.Element {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={clsx(styles.description, className)}
      {...rest}
    />
  );
});

/**
 * - Purpose: action row aligned to the dialog footer edge.
 * - Inputs: optional className and footer action children.
 * - Outputs: flex footer container for primary and secondary actions.
 */
export function DialogFooter({ className, children }: DialogFooterProps): JSX.Element {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}

/**
 * - Purpose: closes the dialog when activated from custom footer actions.
 * - Inputs: Radix close props and optional asChild child button.
 * - Outputs: focus-safe close control participating in dialog lifecycle.
 */
export const DialogClose = forwardRef(function DialogClose(
  { ...rest }: DialogCloseProps,
  ref: Ref<ComponentRef<typeof DialogPrimitive.Close>>,
): JSX.Element {
  return <DialogPrimitive.Close ref={ref} {...rest} />;
});
