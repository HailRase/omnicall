import clsx from "clsx";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type JSX,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { IconButton } from "../icon-button/IconButton.js";
import { Input, type InputProps } from "../input/Input.js";
import { useSidebar } from "./sidebarContext.js";
import styles from "./Sidebar.module.css";

export type SidebarTriggerProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof IconButton>, "iconId" | "ariaLabel" | "onClick"> & {
    toggleLabel: string;
    onClick?: ComponentPropsWithoutRef<typeof IconButton>["onClick"];
  }
>;

/**
 * - Purpose: icon control that toggles desktop collapse or mobile sheet.
 * - Inputs: required toggleLabel for accessible name, IconButton props.
 * - Outputs: IconButton wired to sidebar toggleSidebar.
 */
export const SidebarTrigger = forwardRef(function SidebarTrigger(
  { toggleLabel, className, onClick, ...rest }: SidebarTriggerProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const { toggleSidebar } = useSidebar();

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    onClick?.(event);
    if (!event.defaultPrevented) {
      toggleSidebar();
    }
  }

  return (
    <IconButton
      ref={ref}
      {...rest}
      iconId="ui.sidebar.toggle"
      ariaLabel={toggleLabel}
      variant="ghost"
      size="sm"
      className={clsx(styles.trigger, className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={handleClick}
    />
  );
});

export type SidebarRailProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "type"> & {
    toggleLabel: string;
    className?: string;
  }
>;

/**
 * - Purpose: thin edge hit-area for toggling sidebar without a visible button chrome.
 * - Inputs: required toggleLabel, native button props.
 * - Outputs: absolute rail button participating in peer side/state styles.
 */
export const SidebarRail = forwardRef(function SidebarRail(
  { toggleLabel, className, onClick, ...rest }: SidebarRailProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const { toggleSidebar } = useSidebar();

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    onClick?.(event);
    if (!event.defaultPrevented) {
      toggleSidebar();
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={clsx(styles.rail, className)}
      aria-label={toggleLabel}
      title={toggleLabel}
      tabIndex={-1}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={handleClick}
    />
  );
});

export type SidebarInsetProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: main content region beside the sidebar peer gap.
 * - Inputs: optional className and main children.
 * - Outputs: flexible main surface with inset variant spacing.
 */
export const SidebarInset = forwardRef(function SidebarInset(
  { className, children, ...rest }: SidebarInsetProps,
  ref: Ref<HTMLElement>,
): JSX.Element {
  return (
    <main
      ref={ref}
      {...rest}
      className={clsx(styles.inset, className)}
      data-slot="sidebar-inset"
    >
      {children}
    </main>
  );
});

export type SidebarInputProps = InputProps;

/**
 * - Purpose: compact search/filter input styled for sidebar header density.
 * - Inputs: Input props including invalid/disabled.
 * - Outputs: Input with sidebar data attributes.
 */
export const SidebarInput = forwardRef(function SidebarInput(
  { className, ...rest }: SidebarInputProps,
  ref: Ref<HTMLInputElement>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      size="sm"
      {...rest}
      className={clsx(styles.input, className)}
      data-sidebar="input"
      data-slot="sidebar-input"
    />
  );
});

export type SidebarHeaderProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: top chrome slot for brand, search, or account switchers.
 * - Inputs: optional className and header children.
 * - Outputs: padded flex column region.
 */
export const SidebarHeader = forwardRef(function SidebarHeader(
  { className, children, ...rest }: SidebarHeaderProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.header, className)}
      data-sidebar="header"
      data-slot="sidebar-header"
    >
      {children}
    </div>
  );
});

export type SidebarFooterProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: bottom chrome slot for user/profile actions.
 * - Inputs: optional className and footer children.
 * - Outputs: padded flex column region.
 */
export const SidebarFooter = forwardRef(function SidebarFooter(
  { className, children, ...rest }: SidebarFooterProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.footer, className)}
      data-sidebar="footer"
      data-slot="sidebar-footer"
    >
      {children}
    </div>
  );
});

export type SidebarSeparatorProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children" | "role"> & {
    className?: string;
    decorative?: boolean;
  }
>;

/**
 * - Purpose: horizontal divider between sidebar sections.
 * - Inputs: decorative flag and optional className.
 * - Outputs: hairline separator using sidebar border token.
 */
export const SidebarSeparator = forwardRef(function SidebarSeparator(
  { className, decorative = true, ...rest }: SidebarSeparatorProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.separator, className)}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : "horizontal"}
      data-sidebar="separator"
      data-slot="sidebar-separator"
    />
  );
});

export type SidebarContentProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: scrollable middle region hosting navigation groups.
 * - Inputs: optional className and content children.
 * - Outputs: flex-1 overflow container hidden when icon-collapsed.
 */
export const SidebarContent = forwardRef(function SidebarContent(
  { className, children, ...rest }: SidebarContentProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.content, className)}
      data-sidebar="content"
      data-slot="sidebar-content"
    >
      {children}
    </div>
  );
});
