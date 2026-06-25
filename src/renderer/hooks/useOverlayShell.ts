import { useCallback, useState } from "react";

export type ShellOverlayKind = "settings" | "diagnostics";

export type UseOverlayShellResult = Readonly<{
  settingsOpen: boolean;
  diagnosticsOpen: boolean;
  openSettings: () => void;
  openDiagnostics: () => void;
  closeOverlay: () => void;
}>;

/**
 * - Purpose: ephemeral UI state for settings and diagnostics overlay sheets.
 * - Inputs: none (local React state only).
 * - Outputs: open flags and open/close handlers for shell chrome.
 */
export function useOverlayShell(): UseOverlayShellResult {
  const [activeOverlay, setActiveOverlay] = useState<ShellOverlayKind | null>(null);

  const openSettings = useCallback(() => {
    setActiveOverlay("settings");
  }, []);

  const openDiagnostics = useCallback(() => {
    setActiveOverlay("diagnostics");
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  return {
    settingsOpen: activeOverlay === "settings",
    diagnosticsOpen: activeOverlay === "diagnostics",
    openSettings,
    openDiagnostics,
    closeOverlay,
  };
}
