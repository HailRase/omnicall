import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import styles from "./Sidebar.module.css";

export type SidebarGroupProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: labeled navigation section inside sidebar content.
 * - Inputs: optional className and group children.
 * - Outputs: padded group container with relative positioning for actions.
 */
export const SidebarGroup = forwardRef(function SidebarGroup(
  { className, children, ...rest }: SidebarGroupProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.group, className)}
      data-sidebar="group"
      data-slot="sidebar-group"
    >
      {children}
    </div>
  );
});

export type SidebarGroupLabelProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
    asChild?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: small section title above a menu list.
 * - Inputs: asChild slot merge, className, label children.
 * - Outputs: label element hidden when sidebar collapses to icons.
 */
export const SidebarGroupLabel = forwardRef(function SidebarGroupLabel(
  { asChild = false, className, children, ...rest }: SidebarGroupLabelProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  if (asChild) {
    return (
      <Slot
        ref={ref}
        {...rest}
        className={clsx(styles.groupLabel, className)}
        data-sidebar="group-label"
        data-slot="sidebar-group-label"
      >
        {children}
      </Slot>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.groupLabel, className)}
      data-sidebar="group-label"
      data-slot="sidebar-group-label"
    >
      {children}
    </div>
  );
});

export type SidebarGroupActionProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "type"> & {
    asChild?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: absolute action control in a group header (e.g. add item).
 * - Inputs: asChild, className, children, button props.
 * - Outputs: icon-sized action button hidden in icon-collapsed mode.
 */
export const SidebarGroupAction = forwardRef(function SidebarGroupAction(
  { asChild = false, className, children, ...rest }: SidebarGroupActionProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  if (asChild) {
    return (
      <Slot
        ref={ref}
        {...rest}
        className={clsx(styles.groupAction, className)}
        data-sidebar="group-action"
        data-slot="sidebar-group-action"
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
      className={clsx(styles.groupAction, className)}
      data-sidebar="group-action"
      data-slot="sidebar-group-action"
    >
      {children}
    </button>
  );
});

export type SidebarGroupContentProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: wraps menu lists inside a sidebar group.
 * - Inputs: optional className and content children.
 * - Outputs: full-width text container.
 */
export const SidebarGroupContent = forwardRef(function SidebarGroupContent(
  { className, children, ...rest }: SidebarGroupContentProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.groupContent, className)}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
    >
      {children}
    </div>
  );
});
