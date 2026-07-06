import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type JSX,
  type Ref,
} from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import type { IconSemanticId } from "../../icons/iconCatalog.js";
import styles from "./DropdownMenu.module.css";

export type DropdownMenuProps = Readonly<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>>;

export type DropdownMenuTriggerProps = Readonly<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>;

export type DropdownMenuContentProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>, "className"> & {
    className?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
  }
>;

export type DropdownMenuItemProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>, "className"> & {
    className?: string;
    destructive?: boolean;
    inset?: boolean;
    iconId?: IconSemanticId;
    disabledReason?: string | null;
  }
>;

export type DropdownMenuCheckboxItemProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>, "className"> & {
    className?: string;
    inset?: boolean;
  }
>;

export type DropdownMenuLabelProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>, "className"> & {
    className?: string;
    inset?: boolean;
  }
>;

export type DropdownMenuSeparatorProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>, "className"> & {
    className?: string;
  }
>;

export type DropdownMenuGroupProps = Readonly<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>
>;

function resolveItemDisabled(
  disabled: boolean | undefined,
  disabledReason: string | null | undefined,
): boolean {
  if (disabled === true) {
    return true;
  }
  return disabledReason !== undefined && disabledReason !== null && disabledReason.length > 0;
}

/**
 * - Purpose: composable dropdown action menu root with optional controlled open state.
 * - Inputs: Radix root props including open, defaultOpen, onOpenChange, modal.
 * - Outputs: menu context for trigger, content, items, labels, and separators.
 */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  return <DropdownMenuPrimitive.Root {...props} />;
}

/**
 * - Purpose: opens dropdown menu content from a focusable trigger element.
 * - Inputs: Radix trigger props and child trigger element via asChild.
 * - Outputs: accessible menu button or custom trigger with expanded state.
 */
export const DropdownMenuTrigger = forwardRef(function DropdownMenuTrigger(
  { ...rest }: DropdownMenuTriggerProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.Trigger>>,
): JSX.Element {
  return <DropdownMenuPrimitive.Trigger ref={ref} {...rest} />;
});

/**
 * - Purpose: floating portal menu panel with placement, elevation, and motion tokens.
 * - Inputs: side, align, offset props, className, and Radix content props.
 * - Outputs: portaled menu surface styled with semantic overlay tokens.
 */
export const DropdownMenuContent = forwardRef(function DropdownMenuContent(
  {
    className,
    side = "bottom",
    align = "start",
    sideOffset = 4,
    ...rest
  }: DropdownMenuContentProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.Content>>,
): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={clsx(styles.content, className)}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

/**
 * - Purpose: selectable menu action with optional icon, destructive tone, and disabled reason.
 * - Inputs: item label children, destructive/inset flags, iconId, disabledReason, onSelect.
 * - Outputs: Radix menu item with tooltip when disabled reason is provided.
 */
export const DropdownMenuItem = forwardRef(function DropdownMenuItem(
  {
    className,
    destructive = false,
    inset = false,
    iconId,
    disabledReason = null,
    disabled = false,
    children,
    onSelect,
    ...rest
  }: DropdownMenuItemProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.Item>>,
): JSX.Element {
  const isDisabled = resolveItemDisabled(disabled, disabledReason);

  function handleSelect(event: Event): void {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onSelect?.(event);
  }

  const content = (
    <>
      {iconId !== undefined ? (
        <span className={styles.itemIcon}>
          <AppIcon id={iconId} decorative size={16} />
        </span>
      ) : null}
      {children}
    </>
  );

  const item = (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={clsx(
        styles.item,
        destructive && styles.itemDestructive,
        inset && styles.itemInset,
        className,
      )}
      {...rest}
      disabled={isDisabled}
      data-disabled-reason={disabledReason ? "true" : undefined}
      onSelect={handleSelect}
    >
      {disabledReason ? (
        <IconTooltip label={disabledReason}>
          <span className={styles.disabledReasonHost}>{content}</span>
        </IconTooltip>
      ) : (
        content
      )}
    </DropdownMenuPrimitive.Item>
  );

  return item;
});

/**
 * - Purpose: toggleable checked menu item with leading check indicator.
 * - Inputs: checked state, onCheckedChange, inset flag, and item children.
 * - Outputs: Radix checkbox item with semantic check icon indicator.
 */
export const DropdownMenuCheckboxItem = forwardRef(function DropdownMenuCheckboxItem(
  { className, inset = false, children, ...rest }: DropdownMenuCheckboxItemProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>>,
): JSX.Element {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={clsx(styles.checkboxItem, inset && styles.checkboxItemInset, className)}
      {...rest}
    >
      <span className={styles.checkboxIndicator}>
        <DropdownMenuPrimitive.ItemIndicator>
          <AppIcon id="action.confirm" decorative size={16} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

/**
 * - Purpose: non-interactive menu section label.
 * - Inputs: label text children, optional inset alignment, className.
 * - Outputs: styled menu label element for grouping actions.
 */
export const DropdownMenuLabel = forwardRef(function DropdownMenuLabel(
  { className, inset = false, ...rest }: DropdownMenuLabelProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.Label>>,
): JSX.Element {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={clsx(styles.label, inset && styles.itemInset, className)}
      {...rest}
    />
  );
});

/**
 * - Purpose: visual divider between menu sections.
 * - Inputs: optional className and Radix separator props.
 * - Outputs: horizontal separator line inside menu content.
 */
export const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator(
  { className, ...rest }: DropdownMenuSeparatorProps,
  ref: Ref<ComponentRef<typeof DropdownMenuPrimitive.Separator>>,
): JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={clsx(styles.separator, className)}
      {...rest}
    />
  );
});

/**
 * - Purpose: groups related menu items for roving focus and semantics.
 * - Inputs: Radix group props and grouped menu children.
 * - Outputs: menu item group container.
 */
export function DropdownMenuGroup(props: DropdownMenuGroupProps): JSX.Element {
  return <DropdownMenuPrimitive.Group {...props} />;
}
