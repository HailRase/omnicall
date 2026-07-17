import { createContext, useContext } from "react";

export type SidebarState = "expanded" | "collapsed";

export type SidebarContextValue = Readonly<{
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean | ((previous: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((previous: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}>;

export const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * - Purpose: read sidebar open/collapse context from SidebarProvider.
 * - Inputs: none — must be called under SidebarProvider.
 * - Outputs: sidebar state helpers including toggle and mobile sheet flags.
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (context === null) {
    throw new Error("SIDEBAR_PROVIDER_REQUIRED");
  }
  return context;
}
