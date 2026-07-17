import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { Skeleton } from "../skeleton/Skeleton.js";
import { Tooltip } from "../tooltip/Tooltip.js";
import type {
  SidebarMenuButtonSize,
  SidebarMenuButtonVariant,
  SidebarMenuSubButtonSize,
} from "../types.js";
import { useSidebar } from "./sidebarContext.js";
import styles from "./Sidebar.module.css";

const MENU_BUTTON_VARIANT_CLASS: Record<SidebarMenuButtonVariant, string> = {
  default: "",
  outline: styles.menuButtonVariantOutline ?? "",
};

const MENU_BUTTON_SIZE_CLASS: Record<SidebarMenuButtonSize, string> = {
  default: styles.menuButtonSizeDefault ?? "",
  sm: styles.menuButtonSizeSm ?? "",
  lg: styles.menuButtonSizeLg ?? "",
};

export type SidebarMenuProps = Readonly<
  Omit<HTMLAttributes<HTMLUListElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: unordered list of sidebar navigation items.
 * - Inputs: optional className and menu item children.
 * - Outputs: vertical menu list.
 */
export const SidebarMenu = forwardRef(function SidebarMenu(
  { className, children, ...rest }: SidebarMenuProps,
  ref: Ref<HTMLUListElement>,
): JSX.Element {
  return (
    <ul
      ref={ref}
      {...rest}
      className={clsx(styles.menu, className)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
    >
      {children}
    </ul>
  );
});

export type SidebarMenuItemProps = Readonly<
  Omit<HTMLAttributes<HTMLLIElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: list item wrapper for a menu button and optional action/badge/sub.
 * - Inputs: optional className and item children.
 * - Outputs: relative menu item container.
 */
export const SidebarMenuItem = forwardRef(function SidebarMenuItem(
  { className, children, ...rest }: SidebarMenuItemProps,
  ref: Ref<HTMLLIElement>,
): JSX.Element {
  return (
    <li
      ref={ref}
      {...rest}
      className={clsx(styles.menuItem, className)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
    >
      {children}
    </li>
  );
});

export type SidebarMenuButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "type"> & {
    asChild?: boolean;
    isActive?: boolean;
    variant?: SidebarMenuButtonVariant;
    size?: SidebarMenuButtonSize;
    tooltip?: string;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: primary nav row button with active, size, and collapsed tooltip support.
 * - Inputs: asChild, isActive, variant/size, optional tooltip, button props.
 * - Outputs: button or slotted child with sidebar menu-button semantics.
 */
export const SidebarMenuButton = forwardRef(function SidebarMenuButton(
  {
    asChild = false,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    children,
    disabled = false,
    ...rest
  }: SidebarMenuButtonProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const { isMobile, state } = useSidebar();
  const buttonClassName = clsx(
    styles.menuButton,
    MENU_BUTTON_VARIANT_CLASS[variant],
    MENU_BUTTON_SIZE_CLASS[size],
    className,
  );

  const button = asChild ? (
    <Slot
      ref={ref}
      {...rest}
      className={buttonClassName}
      data-sidebar="menu-button"
      data-slot="sidebar-menu-button"
      data-size={size}
      data-active={isActive ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {children}
    </Slot>
  ) : (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={buttonClassName}
      disabled={disabled}
      data-sidebar="menu-button"
      data-slot="sidebar-menu-button"
      data-size={size}
      data-active={isActive ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {children}
    </button>
  );

  if (tooltip === undefined || tooltip.length === 0) {
    return button;
  }

  return (
    <Tooltip
      label={tooltip}
      side="right"
      disabled={state !== "collapsed" || isMobile}
    >
      {button}
    </Tooltip>
  );
});

export type SidebarMenuActionProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "type"> & {
    asChild?: boolean;
    showOnHover?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: trailing action on a menu row (more menu, pin, etc.).
 * - Inputs: asChild, showOnHover visibility, button props.
 * - Outputs: absolute action control beside the menu button.
 */
export const SidebarMenuAction = forwardRef(function SidebarMenuAction(
  {
    asChild = false,
    showOnHover = false,
    className,
    children,
    ...rest
  }: SidebarMenuActionProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const actionClassName = clsx(
    styles.menuAction,
    showOnHover && styles.menuActionShowOnHover,
    className,
  );

  if (asChild) {
    return (
      <Slot
        ref={ref}
        {...rest}
        className={actionClassName}
        data-sidebar="menu-action"
        data-slot="sidebar-menu-action"
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={actionClassName}
      data-sidebar="menu-action"
      data-slot="sidebar-menu-action"
    >
      {children}
    </button>
  );
});

export type SidebarMenuBadgeProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: non-interactive count/status badge on a menu row.
 * - Inputs: optional className and badge children.
 * - Outputs: absolute badge hidden in icon-collapsed mode.
 */
export const SidebarMenuBadge = forwardRef(function SidebarMenuBadge(
  { className, children, ...rest }: SidebarMenuBadgeProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.menuBadge, className)}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
    >
      {children}
    </div>
  );
});

export type SidebarMenuSkeletonProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    showIcon?: boolean;
    width?: string;
    className?: string;
  }
>;

/**
 * - Purpose: loading placeholder row matching menu button density.
 * - Inputs: showIcon, fixed width percent, className.
 * - Outputs: decorative skeleton row without accessible fake text.
 */
export const SidebarMenuSkeleton = forwardRef(function SidebarMenuSkeleton(
  { showIcon = false, width = "70%", className, style, ...rest }: SidebarMenuSkeletonProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const skeletonStyle = {
    ...style,
    "--skeleton-width": width,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.menuSkeleton, className)}
      style={skeletonStyle}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
    >
      {showIcon ? (
        <Skeleton
          shape="rectangle"
          width={16}
          height={16}
          className={styles.menuSkeletonIcon}
          data-sidebar="menu-skeleton-icon"
        />
      ) : null}
      <Skeleton
        shape="text"
        className={styles.menuSkeletonText}
        data-sidebar="menu-skeleton-text"
      />
    </div>
  );
});

export type SidebarMenuSubProps = Readonly<
  Omit<HTMLAttributes<HTMLUListElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: nested submenu list indented under a parent menu item.
 * - Inputs: optional className and submenu children.
 * - Outputs: bordered nested list hidden in icon-collapsed mode.
 */
export const SidebarMenuSub = forwardRef(function SidebarMenuSub(
  { className, children, ...rest }: SidebarMenuSubProps,
  ref: Ref<HTMLUListElement>,
): JSX.Element {
  return (
    <ul
      ref={ref}
      {...rest}
      className={clsx(styles.menuSub, className)}
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
    >
      {children}
    </ul>
  );
});

export type SidebarMenuSubItemProps = Readonly<
  Omit<HTMLAttributes<HTMLLIElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: list item wrapper for a nested submenu button.
 * - Inputs: optional className and children.
 * - Outputs: relative submenu item container.
 */
export const SidebarMenuSubItem = forwardRef(function SidebarMenuSubItem(
  { className, children, ...rest }: SidebarMenuSubItemProps,
  ref: Ref<HTMLLIElement>,
): JSX.Element {
  return (
    <li
      ref={ref}
      {...rest}
      className={clsx(styles.menuSubItem, className)}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
    >
      {children}
    </li>
  );
});

export type SidebarMenuSubButtonProps = Readonly<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    asChild?: boolean;
    size?: SidebarMenuSubButtonSize;
    isActive?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: nested navigation control rendered as anchor by default.
 * - Inputs: asChild, size, isActive, anchor props.
 * - Outputs: submenu link/button with active styling.
 */
export const SidebarMenuSubButton = forwardRef(function SidebarMenuSubButton(
  {
    asChild = false,
    size = "md",
    isActive = false,
    className,
    children,
    ...rest
  }: SidebarMenuSubButtonProps,
  ref: Ref<HTMLAnchorElement>,
): JSX.Element {
  const subClassName = clsx(
    styles.menuSubButton,
    size === "sm" ? styles.menuSubButtonSizeSm : styles.menuSubButtonSizeMd,
    className,
  );

  if (asChild) {
    return (
      <Slot
        ref={ref}
        {...rest}
        className={subClassName}
        data-sidebar="menu-sub-button"
        data-slot="sidebar-menu-sub-button"
        data-size={size}
        data-active={isActive ? "true" : undefined}
      >
        {children}
      </Slot>
    );
  }

  return (
    <a
      ref={ref}
      {...rest}
      className={subClassName}
      data-sidebar="menu-sub-button"
      data-slot="sidebar-menu-sub-button"
      data-size={size}
      data-active={isActive ? "true" : undefined}
    >
      {children}
    </a>
  );
});
