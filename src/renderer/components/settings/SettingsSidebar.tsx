import type { SettingsNavigationAvailability } from "@application/index.js";
import { useEffect, useRef, type JSX, type MouseEvent } from "react";
import {
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
} from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsNavGroup, SettingsSectionId } from "./settingsSections.js";
import { SETTINGS_NAV_TREE } from "./settingsSections.js";
import { resolveFirstEnabledNavChild } from "./settingsNavGroupAvailability.js";
import {
  SettingsNavGroupItem,
  SettingsNavLeafItem,
} from "./SettingsSidebarNavItems.js";
import styles from "./SettingsSidebar.module.css";

export type SettingsSidebarProps = Readonly<{
  activeSection: SettingsSectionId;
  expanded: boolean;
  sectionAvailability: SettingsNavigationAvailability;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onToggleExpanded: () => void;
}>;

/**
 * - Purpose: render collapsible settings navigation using UI Kit Sidebar primitives.
 * - Inputs: active section, expanded flag, availability VM, section and expand callbacks.
 * - Outputs: icon rail with flyout expand; always-open Integrations cluster (OCP + External
 *   Services); top-level OmniCall Kit below Integrations; gated tooltips.
 */
export function SettingsSidebar({
  activeSection,
  expanded,
  sectionAvailability,
  onSectionChange,
  onToggleExpanded,
}: SettingsSidebarProps): JSX.Element {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      onToggleExpanded();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [expanded, onToggleExpanded]);

  function handleOpenChange(nextOpen: boolean): void {
    if (nextOpen !== expanded) {
      onToggleExpanded();
    }
  }

  function handleGroupActivate(group: SettingsNavGroup): void {
    const targetChild = resolveFirstEnabledNavChild(group, sectionAvailability);
    if (targetChild === undefined) {
      return;
    }
    onSectionChange(targetChild.id);
  }

  function handleChromeClick(event: MouseEvent<HTMLElement>): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (isSettingsSidebarInteractiveTarget(target)) {
      return;
    }
    onToggleExpanded();
  }

  return (
    <nav
      ref={rootRef}
      className={styles.root}
      data-testid="settings-sidebar"
      data-expanded={expanded ? "true" : "false"}
      data-pre-auth-gate={sectionAvailability.isPreAuthGateActive ? "true" : "false"}
      aria-label={t("settings.nav.label")}
      onClick={handleChromeClick}
    >
      <SidebarProvider
        open={expanded}
        onOpenChange={handleOpenChange}
        enableKeyboardShortcut={false}
        className={styles.provider}
      >
        <Sidebar
          collapsible="icon"
          mobileTitle={t("settings.nav.label")}
          className={styles.sidebar}
        >
          <SidebarHeader className={styles.header}>
            <IconButton
              iconId={expanded ? "settings.nav.collapse" : "settings.nav.expand"}
              ariaLabel={
                expanded ? t("settings.nav.collapseMenu") : t("settings.nav.expandMenu")
              }
              data-testid={expanded ? "settings-sidebar-collapse" : "settings-sidebar-expand"}
              data-settings-nav-interactive=""
              variant="ghost"
              size="sm"
              className={styles.toggleButton}
              aria-expanded={expanded}
              onClick={onToggleExpanded}
            />
          </SidebarHeader>
          <SidebarContent className={styles.content}>
            <SidebarMenu className={styles.menu}>
              {SETTINGS_NAV_TREE.map((node) => {
                if (node.kind === "item") {
                  return (
                    <SettingsNavLeafItem
                      key={node.id}
                      item={node}
                      activeSection={activeSection}
                      expanded={expanded}
                      sectionAvailability={sectionAvailability}
                      onSectionChange={onSectionChange}
                    />
                  );
                }

                return (
                  <SettingsNavGroupItem
                    key={node.id}
                    group={node}
                    activeSection={activeSection}
                    expanded={expanded}
                    sectionAvailability={sectionAvailability}
                    onGroupActivate={handleGroupActivate}
                    onSectionChange={onSectionChange}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </nav>
  );
}

function isSettingsSidebarInteractiveTarget(target: Element): boolean {
  return (
    target.closest("[data-settings-nav-interactive]") !== null ||
    target.closest('[data-testid="icon-tooltip-host"]') !== null
  );
}
