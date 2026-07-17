import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
} from "react";
import { TooltipProvider } from "../tooltip/Tooltip.js";
import { SidebarContext, type SidebarContextValue, type SidebarState } from "./sidebarContext.js";
import styles from "./Sidebar.module.css";
import { useIsMobile } from "./useIsMobile.js";

const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export type SidebarProviderProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    enableKeyboardShortcut?: boolean;
    mobileBreakpoint?: number;
    forceMobile?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

/**
 * - Purpose: provide controlled/uncontrolled sidebar open state and keyboard toggle.
 * - Inputs: open props, optional mobile force/breakpoint, wrapper className.
 * - Outputs: context for Sidebar descendants and CSS width variables on the wrapper.
 */
export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  enableKeyboardShortcut = true,
  mobileBreakpoint = 768,
  forceMobile,
  className,
  children,
  ...rest
}: SidebarProviderProps): JSX.Element {
  const isMobile = useIsMobile(mobileBreakpoint, forceMobile);
  const [openMobile, setOpenMobile] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = useCallback(
    (value: boolean | ((previous: boolean) => boolean)) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      if (onOpenChange !== undefined) {
        onOpenChange(nextOpen);
      } else {
        setUncontrolledOpen(nextOpen);
      }
    },
    [onOpenChange, open],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((previous) => !previous);
      return;
    }
    setOpen((previous) => !previous);
  }, [isMobile, setOpen]);

  useEffect(() => {
    if (!enableKeyboardShortcut) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== SIDEBAR_KEYBOARD_SHORTCUT) {
        return;
      }
      if (!event.metaKey && !event.ctrlKey) {
        return;
      }
      event.preventDefault();
      toggleSidebar();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableKeyboardShortcut, toggleSidebar]);

  const state: SidebarState = open ? "expanded" : "collapsed";

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          {...rest}
          className={clsx(styles.wrapper, className)}
          data-slot="sidebar-wrapper"
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
