import type {
  SettingsNavDisabledReasonKey,
  SettingsNavigationAvailability,
} from "@application/index.js";
import clsx from "clsx";
import { useEffect, useRef, useState, type JSX } from "react";
import { AppIcon } from "../icons/index.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import {
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsNavGroup, SettingsNavLeaf, SettingsSectionId } from "./settingsSections.js";
import { isSettingsSectionInGroup, SETTINGS_NAV_TREE } from "./settingsSections.js";
import styles from "./SettingsSidebar.module.css";

const NAV_ICON_SIZE = 16;
const CHILD_ICON_SIZE = 14;
const CHEVRON_ICON_SIZE = 12;

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
 * - Outputs: icon rail with flyout expand, nested Integrations → OCP Module, top-level
 *   Axatalk SDK below Integrations, gated tooltips.
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

  const [openGroupIds, setOpenGroupIds] = useState<ReadonlyArray<string>>(() =>
    resolveOpenGroupsForSection(activeSection),
  );

  useEffect(() => {
    setOpenGroupIds((prev) => {
      const required = resolveOpenGroupsForSection(activeSection);
      if (required.every((id) => prev.includes(id))) {
        return prev;
      }
      return Array.from(new Set([...prev, ...required]));
    });
  }, [activeSection]);

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

  function toggleGroup(groupId: string): void {
    setOpenGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }

  function handleGroupClick(group: SettingsNavGroup): void {
    const targetChild = resolveFirstEnabledNavChild(group, sectionAvailability);
    if (targetChild === undefined) {
      return;
    }
    if (!expanded) {
      onSectionChange(targetChild.id);
      return;
    }
    const isOpen = openGroupIds.includes(group.id);
    if (!isOpen) {
      toggleGroup(group.id);
      if (!isSettingsSectionInGroup(group, activeSection)) {
        onSectionChange(targetChild.id);
      }
      return;
    }
    toggleGroup(group.id);
  }

  return (
    <nav
      ref={rootRef}
      className={styles.root}
      data-testid="settings-sidebar"
      data-expanded={expanded ? "true" : "false"}
      data-pre-auth-gate={sectionAvailability.isPreAuthGateActive ? "true" : "false"}
      aria-label={t("settings.nav.label")}
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

                const groupOpen = openGroupIds.includes(node.id);
                const groupActive = isSettingsSectionInGroup(node, activeSection);
                const groupLabel = t(node.labelKey);
                // Group stays clickable when any child is allowed (mixed pre-auth gates).
                const groupBlocked = isNavGroupBlocked(node, sectionAvailability);
                const groupDisabledReason = groupBlocked
                  ? resolveNavGroupDisabledReasonKey(node, sectionAvailability)
                  : null;
                const groupDisabledTooltip =
                  groupDisabledReason !== null ? t(groupDisabledReason) : "";

                const groupButton = (
                  <SidebarMenuButton
                    isActive={groupActive}
                    disabled={groupBlocked}
                    {...(expanded || groupBlocked
                      ? {}
                      : { tooltip: groupLabel })}
                    data-testid={node.testId}
                    aria-expanded={expanded ? groupOpen : undefined}
                    aria-controls={expanded ? `settings-nav-group-${node.id}` : undefined}
                    aria-label={groupLabel}
                    aria-disabled={groupBlocked || undefined}
                    className={styles.menuButton}
                    onClick={() => {
                      handleGroupClick(node);
                    }}
                  >
                    <span className={styles.iconSlot}>
                      <AppIcon id={node.iconId} decorative size={NAV_ICON_SIZE} />
                    </span>
                    <span className={styles.label}>{groupLabel}</span>
                    {expanded ? (
                      <span
                        className={clsx(
                          styles.groupChevron,
                          groupOpen && styles.groupChevronOpen,
                        )}
                        aria-hidden
                      >
                        <AppIcon
                          id="ui.select.chevron"
                          decorative
                          size={CHEVRON_ICON_SIZE}
                        />
                      </span>
                    ) : null}
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={node.id}>
                    {groupBlocked && groupDisabledTooltip.length > 0 ? (
                      <IconTooltip label={groupDisabledTooltip} placement="right">
                        <span className={styles.disabledNavWrap}>{groupButton}</span>
                      </IconTooltip>
                    ) : (
                      groupButton
                    )}
                    {expanded && groupOpen ? (
                      <SidebarMenuSub
                        id={`settings-nav-group-${node.id}`}
                        className={styles.subMenu}
                        data-testid={`settings-nav-group-${node.id}`}
                      >
                        {node.children.map((child) => (
                          <SettingsNavChildItem
                            key={child.id}
                            item={child}
                            activeSection={activeSection}
                            sectionAvailability={sectionAvailability}
                            onSectionChange={onSectionChange}
                          />
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </nav>
  );
}

type SettingsNavLeafItemProps = Readonly<{
  item: SettingsNavLeaf;
  activeSection: SettingsSectionId;
  expanded: boolean;
  sectionAvailability: SettingsNavigationAvailability;
  onSectionChange: (sectionId: SettingsSectionId) => void;
}>;

function SettingsNavLeafItem({
  item,
  activeSection,
  expanded,
  sectionAvailability,
  onSectionChange,
}: SettingsNavLeafItemProps): JSX.Element {
  const { t } = useI18n();
  const isActive = item.id === activeSection;
  const sectionLabel = t(item.labelKey);
  const availability = sectionAvailability.bySection[item.id];
  const blocked = availability?.enabled === false;
  const disabledReason =
    blocked && availability.disabledReasonKey !== null
      ? t(availability.disabledReasonKey)
      : "";

  const button = (
    <SidebarMenuButton
      isActive={isActive}
      disabled={blocked}
      {...(expanded || blocked ? {} : { tooltip: sectionLabel })}
      data-testid={item.testId}
      aria-current={isActive ? "page" : undefined}
      aria-label={sectionLabel}
      aria-disabled={blocked || undefined}
      className={styles.menuButton}
      onClick={() => {
        if (!blocked) {
          onSectionChange(item.id);
        }
      }}
    >
      <span className={styles.iconSlot}>
        <AppIcon id={item.iconId} decorative size={NAV_ICON_SIZE} />
      </span>
      <span className={styles.label}>{sectionLabel}</span>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {blocked && disabledReason.length > 0 ? (
        <IconTooltip label={disabledReason} placement="right">
          <span className={styles.disabledNavWrap}>{button}</span>
        </IconTooltip>
      ) : (
        button
      )}
    </SidebarMenuItem>
  );
}

type SettingsNavChildItemProps = Readonly<{
  item: SettingsNavLeaf;
  activeSection: SettingsSectionId;
  sectionAvailability: SettingsNavigationAvailability;
  onSectionChange: (sectionId: SettingsSectionId) => void;
}>;

function SettingsNavChildItem({
  item,
  activeSection,
  sectionAvailability,
  onSectionChange,
}: SettingsNavChildItemProps): JSX.Element {
  const { t } = useI18n();
  const isActive = item.id === activeSection;
  const sectionLabel = t(item.labelKey);
  const availability = sectionAvailability.bySection[item.id];
  const blocked = availability?.enabled === false;
  const disabledReason =
    blocked && availability.disabledReasonKey !== null
      ? t(availability.disabledReasonKey)
      : "";

  const childButton = (
    <button
      type="button"
      data-testid={item.testId}
      aria-current={isActive ? "page" : undefined}
      aria-label={sectionLabel}
      aria-disabled={blocked || undefined}
      disabled={blocked}
      onClick={() => {
        if (!blocked) {
          onSectionChange(item.id);
        }
      }}
    >
      <span className={styles.childIconSlot}>
        <AppIcon id={item.iconId} decorative size={CHILD_ICON_SIZE} />
      </span>
      <span className={styles.childLabel}>{sectionLabel}</span>
    </button>
  );

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        size="sm"
        className={styles.childButton}
      >
        {blocked && disabledReason.length > 0 ? (
          <IconTooltip label={disabledReason} placement="right">
            <span className={styles.disabledNavWrap}>{childButton}</span>
          </IconTooltip>
        ) : (
          childButton
        )}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function resolveOpenGroupsForSection(sectionId: SettingsSectionId): ReadonlyArray<string> {
  return SETTINGS_NAV_TREE.flatMap((node) => {
    if (node.kind === "group" && isSettingsSectionInGroup(node, sectionId)) {
      return [node.id];
    }
    return [];
  });
}

/**
 * First leaf that the availability VM allows (tree order). Used for group click target
 * when some children are gated (e.g. pre-auth OCP off, Axatalk SDK on).
 */
function resolveFirstEnabledNavChild(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): SettingsNavLeaf | undefined {
  return group.children.find(
    (child) => sectionAvailability.bySection[child.id]?.enabled === true,
  );
}

/** True only when every child is blocked (or the group has no children). */
function isNavGroupBlocked(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): boolean {
  return resolveFirstEnabledNavChild(group, sectionAvailability) === undefined;
}

/** Disabled reason from the first blocked child that carries a semantic key. */
function resolveNavGroupDisabledReasonKey(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): SettingsNavDisabledReasonKey | null {
  for (const child of group.children) {
    const availability = sectionAvailability.bySection[child.id];
    if (
      availability?.enabled === false &&
      availability.disabledReasonKey !== null &&
      availability.disabledReasonKey !== undefined
    ) {
      return availability.disabledReasonKey;
    }
  }
  return null;
}
