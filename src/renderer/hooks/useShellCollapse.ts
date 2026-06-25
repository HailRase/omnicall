import { useCallback, useState } from "react";

export type UseShellCollapseResult = Readonly<{
  collapsed: boolean;
  toggleCollapsed: () => void;
}>;

/**
 * - Purpose: ephemeral UI state for collapsed vs expanded shell layout.
 * - Inputs: none (local React state only).
 * - Outputs: collapsed flag and toggle handler for shell chrome.
 */
export function useShellCollapse(): UseShellCollapseResult {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => !previous);
  }, []);

  return {
    collapsed,
    toggleCollapsed,
  };
}
