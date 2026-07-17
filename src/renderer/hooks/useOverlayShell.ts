import {
  deriveDefaultSettingsSection,
  deriveSettingsNavigationAvailability,
  isSettingsNavSectionId,
  resolveAllowedSettingsSection,
  type SettingsNavigationAvailability,
  type SettingsNavSectionId,
} from "@application/index.js";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SettingsSectionId } from "../components/settings/settingsSections.js";
import { DEFAULT_SETTINGS_SECTION } from "../components/settings/settingsSections.js";
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
  settingsNavigationAvailability: SettingsNavigationAvailability;
  openSettings: (section?: unknown) => void;
  openDiagnostics: () => void;
  closeOverlay: () => void;
  setSettingsSection: (section: SettingsSectionId) => void;
}>;

function toNavSectionId(section: SettingsSectionId): SettingsNavSectionId {
  return section;
}

/**
 * - Purpose: route-driven fullscreen settings overlay state and section selection.
 * - Inputs: hash-router location from shell navigation; SIP-ready gate flags.
 * - Outputs: open flag, gated section id, availability VM, open/close handlers.
 */
export function useOverlayShell(): UseOverlayShellResult {
  const navigate = useNavigate();
  const location = useLocation();
  const { route, goBackSafe, goToDialpad } = useShellNavigation();
  const authFlags = useAuthShellFlags();
  const defaultSettingsSection = useMemo(
    () => deriveDefaultSettingsSection(authFlags),
    [authFlags],
  );
  const settingsNavigationAvailability = useMemo(
    () => deriveSettingsNavigationAvailability(authFlags),
    [authFlags],
  );

  const settingsOpen = route.name === "settings";
  const settingsSection = useMemo((): SettingsSectionId => {
    if (route.name === "settings") {
      return resolveAllowedSettingsSection(
        settingsNavigationAvailability,
        toNavSectionId(route.section),
      );
    }
    return DEFAULT_SETTINGS_SECTION;
  }, [route, settingsNavigationAvailability]);

  useEffect(() => {
    if (!settingsOpen || route.name !== "settings") {
      return;
    }

    const returnTo = readSettingsReturnTo(location.state);
    const navState =
      returnTo !== null ? { settingsReturnTo: returnTo } : undefined;

    // Bare `/settings` uses DEFAULT_SETTINGS_SECTION ("general") in the parser.
    // Pre-auth must land on Account; keep prior redirect for unregistered users.
    if (location.pathname === "/settings") {
      if (defaultSettingsSection === "general") {
        return;
      }
      void navigate(
        shellRouteToPath({ name: "settings", section: defaultSettingsSection }),
        { replace: true, state: navState },
      );
      return;
    }

    const allowed = resolveAllowedSettingsSection(
      settingsNavigationAvailability,
      toNavSectionId(route.section),
    );
    if (allowed === route.section) {
      return;
    }

    void navigate(shellRouteToPath({ name: "settings", section: allowed }), {
      replace: true,
      state: navState,
    });
  }, [
    defaultSettingsSection,
    location.pathname,
    location.state,
    navigate,
    route,
    settingsNavigationAvailability,
    settingsOpen,
  ]);

  const openSettings = useCallback(
    (section?: unknown): void => {
      const requested = isSettingsNavSectionId(section)
        ? section
        : defaultSettingsSection;
      const allowed = resolveAllowedSettingsSection(
        settingsNavigationAvailability,
        requested,
      );
      void navigate(shellRouteToPath({ name: "settings", section: allowed }), {
        state: createSettingsNavigationState(location.pathname, location.state),
      });
    },
    [
      defaultSettingsSection,
      location.pathname,
      location.state,
      navigate,
      settingsNavigationAvailability,
    ],
  );

  const openDiagnostics = useCallback((): void => {
    openSettings("diagnostics");
  }, [openSettings]);

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
      const allowed = resolveAllowedSettingsSection(
        settingsNavigationAvailability,
        toNavSectionId(section),
      );
      const returnTo = readSettingsReturnTo(location.state);
      void navigate(shellRouteToPath({ name: "settings", section: allowed }), {
        replace: true,
        state: returnTo !== null ? { settingsReturnTo: returnTo } : undefined,
      });
    },
    [location.state, navigate, settingsNavigationAvailability],
  );

  return {
    settingsOpen,
    settingsSection,
    settingsNavigationAvailability,
    openSettings,
    openDiagnostics,
    closeOverlay,
    setSettingsSection,
  };
}
