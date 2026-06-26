import { useCallback, useState } from "react";
import type { SettingsSectionId } from "../components/settings/settingsSections.js";
import {
  DEFAULT_SETTINGS_SECTION,
  isSettingsSectionId,
} from "../components/settings/settingsSections.js";

export type { SettingsSectionId };

export type UseOverlayShellResult = Readonly<{
  settingsOpen: boolean;
  settingsSection: SettingsSectionId;
  openSettings: (section?: unknown) => void;
  openDiagnostics: () => void;
  closeOverlay: () => void;
  setSettingsSection: (section: SettingsSectionId) => void;
}>;

/**
 * - Purpose: ephemeral UI state for fullscreen settings overlay and active section.
 * - Inputs: none (local React state only).
 * - Outputs: open flag, section id, and open/close handlers for shell chrome.
 */
export function useOverlayShell(): UseOverlayShellResult {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionId>(DEFAULT_SETTINGS_SECTION);

  const openSettings = useCallback((section?: unknown): void => {
    const resolved = isSettingsSectionId(section) ? section : DEFAULT_SETTINGS_SECTION;
    setSettingsSection(resolved);
    setSettingsOpen(true);
  }, []);

  const openDiagnostics = useCallback((): void => {
    setSettingsSection("diagnostics");
    setSettingsOpen(true);
  }, []);

  const closeOverlay = useCallback((): void => {
    setSettingsOpen(false);
  }, []);

  return {
    settingsOpen,
    settingsSection,
    openSettings,
    openDiagnostics,
    closeOverlay,
    setSettingsSection,
  };
}
