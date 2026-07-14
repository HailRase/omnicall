import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type JSX } from "react";
import { AppIcon, IconTooltip } from "../icons/index.js";
import { Button, IconButton } from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsNavGroup, SettingsNavLeaf, SettingsSectionId } from "./settingsSections.js";
import { isSettingsSectionInGroup, SETTINGS_NAV_TREE } from "./settingsSections.js";
import styles from "./SettingsSidebar.module.css";

const COLLAPSED_WIDTH_PX = 56;
const EXPANDED_WIDTH_PX = 220;

export type SettingsSidebarProps = Readonly<{
  activeSection: SettingsSectionId;
  expanded: boolean;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onToggleExpanded: () => void;
}>;

/**
 * - Purpose: render collapsible settings navigation rail with overlay expand mode.
 * - Inputs: active section, expanded flag, section and expand callbacks.
 * - Outputs: animated icon rail with nested Integrations → OCP Module; collapsed hover tooltips.
 */
export function SettingsSidebar({
  activeSection,
  expanded,
  onSectionChange,
  onToggleExpanded,
}: SettingsSidebarProps): JSX.Element {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

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

  function toggleGroup(groupId: string): void {
    setOpenGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }

  function handleGroupClick(group: SettingsNavGroup): void {
    if (!expanded) {
      const firstChild = group.children[0];
      if (firstChild !== undefined) {
        onSectionChange(firstChild.id);
      }
      return;
    }
    const isOpen = openGroupIds.includes(group.id);
    if (!isOpen) {
      toggleGroup(group.id);
      const firstChild = group.children[0];
      if (firstChild !== undefined && !isSettingsSectionInGroup(group, activeSection)) {
        onSectionChange(firstChild.id);
      }
      return;
    }
    toggleGroup(group.id);
  }

  return (
    <nav
      className={styles.rail}
      data-testid="settings-sidebar"
      data-expanded={expanded ? "true" : "false"}
      aria-label={t("settings.nav.label")}
    >
      <motion.div
        className={clsx(styles.panel, expanded && styles.panelExpanded)}
        initial={false}
        animate={{ width: expanded ? EXPANDED_WIDTH_PX : COLLAPSED_WIDTH_PX }}
        transition={transition}
      >
        <div className={clsx(styles.panelInner, expanded && styles.panelInnerExpanded)}>
          <div className={styles.toggleSlot}>
            <IconButton
              iconId={expanded ? "settings.nav.collapse" : "settings.nav.expand"}
              ariaLabel={
                expanded
                  ? t("settings.nav.collapseMenu")
                  : t("settings.nav.expandMenu")
              }
              data-testid={expanded ? "settings-sidebar-collapse" : "settings-sidebar-expand"}
              variant="secondary"
              size="lg"
              className={styles.toggleButton}
              aria-expanded={expanded}
              onClick={onToggleExpanded}
            />
          </div>
          <ul className={styles.navList} role="list">
            {SETTINGS_NAV_TREE.map((node) => {
              if (node.kind === "item") {
                return (
                  <li key={node.id} className={styles.navItem}>
                    <SettingsNavLeafButton
                      item={node}
                      activeSection={activeSection}
                      expanded={expanded}
                      transition={transition}
                      onSectionChange={onSectionChange}
                    />
                  </li>
                );
              }

              const groupOpen = openGroupIds.includes(node.id);
              const groupActive = isSettingsSectionInGroup(node, activeSection);
              const groupLabel = t(node.labelKey);

              return (
                <li key={node.id} className={styles.navItem}>
                  <div className={styles.navGroup}>
                    <IconTooltip
                      label={expanded ? "" : groupLabel}
                      placement="right"
                      className={styles.navTooltipHost}
                    >
                      <Button
                        variant="ghost"
                        className={clsx(
                          styles.navButton,
                          groupActive && styles.navButtonActive,
                        )}
                        data-testid={node.testId}
                        aria-expanded={expanded ? groupOpen : undefined}
                        aria-controls={
                          expanded ? `settings-nav-group-${node.id}` : undefined
                        }
                        aria-label={groupLabel}
                        onClick={() => {
                          handleGroupClick(node);
                        }}
                      >
                        <span className={styles.navIcon}>
                          <AppIcon id={node.iconId} decorative />
                        </span>
                        <motion.span
                          className={styles.navLabel}
                          initial={false}
                          animate={{ opacity: expanded ? 1 : 0 }}
                          transition={transition}
                          aria-hidden={!expanded}
                        >
                          {groupLabel}
                        </motion.span>
                        {expanded ? (
                          <span
                            className={clsx(
                              styles.navGroupChevron,
                              groupOpen && styles.navGroupChevronOpen,
                            )}
                            aria-hidden
                          >
                            <AppIcon id="ui.select.chevron" decorative size={14} />
                          </span>
                        ) : null}
                      </Button>
                    </IconTooltip>
                    {expanded && groupOpen ? (
                      <ul
                        id={`settings-nav-group-${node.id}`}
                        className={styles.navChildList}
                        role="list"
                        data-testid={`settings-nav-group-${node.id}`}
                      >
                        {node.children.map((child) => (
                          <li key={child.id} className={styles.navChildItem}>
                            <SettingsNavLeafButton
                              item={child}
                              activeSection={activeSection}
                              expanded={expanded}
                              transition={transition}
                              onSectionChange={onSectionChange}
                              child
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </nav>
  );
}

type MotionTransition = Readonly<{ duration: number; ease?: readonly [number, number, number, number] }>;

type SettingsNavLeafButtonProps = Readonly<{
  item: SettingsNavLeaf;
  activeSection: SettingsSectionId;
  expanded: boolean;
  transition: MotionTransition;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  child?: boolean;
}>;

function SettingsNavLeafButton({
  item,
  activeSection,
  expanded,
  transition,
  onSectionChange,
  child = false,
}: SettingsNavLeafButtonProps): JSX.Element {
  const { t } = useI18n();
  const isActive = item.id === activeSection;
  const sectionLabel = t(item.labelKey);
  const tooltipLabel = expanded ? "" : sectionLabel;

  return (
    <IconTooltip label={tooltipLabel} placement="right" className={styles.navTooltipHost}>
      <Button
        variant="ghost"
        className={clsx(
          styles.navButton,
          child && styles.navChildButton,
          isActive && styles.navButtonActive,
        )}
        data-testid={item.testId}
        aria-current={isActive ? "page" : undefined}
        aria-label={sectionLabel}
        onClick={() => {
          onSectionChange(item.id);
        }}
      >
        <span className={styles.navIcon}>
          <AppIcon id={item.iconId} decorative />
        </span>
        <motion.span
          className={styles.navLabel}
          initial={false}
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={transition}
          aria-hidden={!expanded}
        >
          {sectionLabel}
        </motion.span>
      </Button>
    </IconTooltip>
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
