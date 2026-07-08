import { deriveDefaultSettingsSection } from "@application/index.js";import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SettingsSectionId } from "../components/settings/settingsSections.js";
import {
  DEFAULT_SETTINGS_SECTION,
  isSettingsSectionId,
} from "../components/settings/settingsSections.js";
import {
  createSettingsNavigationState,
  readSettingsReturnTo,
} from "../navigation/settingsNavigationState.js";
import { shellRouteToPath } from "../navigation/shellRoutePaths.js";
import { useShellNavigation } from "../navigation/useShellNavigation.js";
import { useAuthShellFlags } from "./useAuthShellFlags.js";

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
 * - Purpose: route-driven fullscreen settings overlay state and section selection.
 * - Inputs: hash-router location from shell navigation.
 * - Outputs: open flag, validated section id, and open/close handlers for shell chrome.
 */
export function useOverlayShell(): UseOverlayShellResult {
  const navigate = useNavigate();
  const location = useLocation();
  const { route, goBackSafe, goToDialpad } = useShellNavigation();
  const authFlags = useAuthShellFlags();
  const defaultSettingsSection = useMemo(
    () => deriveDefaultSettingsSection(authFlags),
    [authFlags.isSipRegistered],
  );

  const settingsOpen = route.name === "settings";
  const settingsSection = useMemo((): SettingsSectionId => {
    if (route.name === "settings") {
      return route.section;
    }
    return DEFAULT_SETTINGS_SECTION;
  }, [route]);

  useEffect(() => {
    if (!settingsOpen || authFlags.isSipRegistered) {
      return;
    }
    if (settingsSection === "account") {
      return;
    }

    const returnTo = readSettingsReturnTo(location.state);
    void navigate(shellRouteToPath({ name: "settings", section: "account" }), {
      replace: true,
      state: returnTo !== null ? { settingsReturnTo: returnTo } : undefined,
    });
  }, [authFlags.isSipRegistered, location.state, navigate, settingsOpen, settingsSection]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    if (location.pathname !== "/settings") {
      return;
    }
    if (defaultSettingsSection === "general") {
      return;
    }

    const returnTo = readSettingsReturnTo(location.state);
    void navigate(shellRouteToPath({ name: "settings", section: defaultSettingsSection }), {
      replace: true,
      state: returnTo !== null ? { settingsReturnTo: returnTo } : undefined,
    });
  }, [defaultSettingsSection, location.pathname, location.state, navigate, settingsOpen]);

  const openSettings = useCallback(
    (section?: unknown): void => {
      const resolved = isSettingsSectionId(section) ? section : defaultSettingsSection;
      void navigate(shellRouteToPath({ name: "settings", section: resolved }), {
        state: createSettingsNavigationState(location.pathname, location.state),
      });
    },
    [defaultSettingsSection, location.pathname, location.state, navigate],
  );

  const openDiagnostics = useCallback((): void => {
    const section: SettingsSectionId = authFlags.isSipRegistered ? "diagnostics" : "account";
    void navigate(shellRouteToPath({ name: "settings", section }), {
      state: createSettingsNavigationState(location.pathname, location.state),
    });
  }, [authFlags.isSipRegistered, location.pathname, location.state, navigate]);

  const closeOverlay = useCallback((): void => {
    if (!settingsOpen) {
      return;
    }

    const returnTo = readSettingsReturnTo(location.state);
    if (returnTo !== null) {
      void navigate(returnTo);
      return;
    }

    if (location.key === "default") {
      goToDialpad();
      return;
    }

    goBackSafe();
  }, [goBackSafe, goToDialpad, location.key, location.state, navigate, settingsOpen]);

  const setSettingsSection = useCallback(
    (section: SettingsSectionId): void => {
      if (!authFlags.isSipRegistered && section !== "account") {
        return;
      }

      const returnTo = readSettingsReturnTo(location.state);
      void navigate(shellRouteToPath({ name: "settings", section }), {
        replace: true,
        state: returnTo !== null ? { settingsReturnTo: returnTo } : undefined,
      });
    },
    [authFlags.isSipRegistered, location.state, navigate],
  );

  return {
    settingsOpen,
    settingsSection,
    openSettings,
    openDiagnostics,
    closeOverlay,
    setSettingsSection,
  };
}
