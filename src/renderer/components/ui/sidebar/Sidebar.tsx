import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx";
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import type { SidebarCollapsible, SidebarSide, SidebarVariant } from "../types.js";
import { useSidebar } from "./sidebarContext.js";
import styles from "./Sidebar.module.css";

export type SidebarProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    side?: SidebarSide;
    variant?: SidebarVariant;
    collapsible?: SidebarCollapsible;
    mobileTitle: string;
    mobileDescription?: string;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: shadcn-like sidebar shell with desktop collapse modes and mobile dialog sheet.
 * - Inputs: side/variant/collapsible, required mobileTitle, optional mobileDescription.
 * - Outputs: gap + fixed container on desktop, or Radix Dialog sheet on mobile.
 */
export const Sidebar = forwardRef(function Sidebar(
  {
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    mobileTitle,
    mobileDescription,
    className,
    children,
    ...rest
  }: SidebarProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        ref={ref}
        {...rest}
        className={clsx(styles.sidebarFixed, className)}
        data-slot="sidebar"
        data-side={side}
        data-variant={variant}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <SidebarMobileSheet
        side={side}
        open={openMobile}
        onOpenChange={setOpenMobile}
        mobileTitle={mobileTitle}
        {...(mobileDescription !== undefined ? { mobileDescription } : {})}
        {...(className !== undefined ? { className } : {})}
      >
        {children}
      </SidebarMobileSheet>
    );
  }

  const collapsibleMode = state === "collapsed" ? collapsible : "";

  return (
    <div
      className={styles.peer}
      data-state={state}
      data-collapsible={collapsibleMode}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div className={styles.gap} data-slot="sidebar-gap" />
      <div
        ref={ref}
        {...rest}
        className={clsx(styles.container, className)}
        data-slot="sidebar-container"
      >
        <div className={styles.inner} data-sidebar="sidebar" data-slot="sidebar-inner">
          {children}
        </div>
      </div>
    </div>
  );
});

type SidebarMobileSheetProps = Readonly<{
  side: SidebarSide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobileTitle: string;
  mobileDescription?: string;
  className?: string;
  children?: ReactNode;
}>;

function SidebarMobileSheet({
  side,
  open,
  onOpenChange,
  mobileTitle,
  mobileDescription,
  className,
  children,
}: SidebarMobileSheetProps): JSX.Element {
  const contentStyle = {
    "--sidebar-width": "var(--sidebar-width-mobile)",
  } as CSSProperties;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.mobileOverlay} />
        <DialogPrimitive.Content
          className={clsx(
            styles.mobileContent,
            side === "right" ? styles.mobileContentRight : styles.mobileContentLeft,
            className,
          )}
          style={contentStyle}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          data-side={side}
        >
          <DialogPrimitive.Title className={styles.srOnly}>{mobileTitle}</DialogPrimitive.Title>
          {mobileDescription !== undefined ? (
            <DialogPrimitive.Description className={styles.srOnly}>
              {mobileDescription}
            </DialogPrimitive.Description>
          ) : null}
          <div className={styles.mobileInner}>{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
