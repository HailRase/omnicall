/**
 * - Purpose: shared UI Kit type aliases for control variants and sizes.
 * - Inputs: none — compile-time contracts for primitives.
 * - Outputs: exported unions reused across UI Kit components.
 */

export type ControlSize = "sm" | "md" | "lg";

export type TextareaResize = "none" | "vertical";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = ControlSize | "icon";

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type DialogSize = "sm" | "md" | "lg" | "fullscreen";

export type ToastTone = "default" | "success" | "warning" | "destructive" | "info";

export type NotificationTone = ToastTone;

export type ToastPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type SonnerPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ProgressTone = "default" | "success" | "warning" | "destructive";

export type SkeletonShape = "text" | "rectangle" | "circle";

export type BadgeTone = "default" | "muted" | "success" | "warning" | "destructive" | "info";

export type BadgeSize = "sm" | "md";

export type TableCellAlign = "left" | "center" | "right";

export type AlertVariant = "default" | "destructive";

export type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end";

export type InputGroupButtonSize = "xs" | "sm" | "icon-xs" | "icon-sm";

export type ButtonGroupOrientation = "horizontal" | "vertical";

export type SidebarSide = "left" | "right";

export type SidebarVariant = "sidebar" | "floating" | "inset";

export type SidebarCollapsible = "offcanvas" | "icon" | "none";

export type SidebarMenuButtonVariant = "default" | "outline";

export type SidebarMenuButtonSize = "default" | "sm" | "lg";

export type SidebarMenuSubButtonSize = "sm" | "md";
