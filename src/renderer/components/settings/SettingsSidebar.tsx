import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { JSX } from "react";
import { AppIcon, IconTooltip } from "../icons/index.js";
import { Button, IconButton } from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsSectionId } from "./settingsSections.js";
import { SETTINGS_NAV_ITEMS } from "./settingsSections.js";
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
 * - Outputs: animated icon rail with optional expanded labels over content; collapsed hover tooltips via IconTooltip.
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
            {SETTINGS_NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSection;
              const sectionLabel = t(item.labelKey);
              return (
                <li key={item.id} className={styles.navItem}>
                  <IconTooltip
                    label={expanded ? "" : sectionLabel}
                    placement="right"
                    className={styles.navTooltipHost}
                  >
                    <Button
                      variant="ghost"
                      className={clsx(styles.navButton, isActive && styles.navButtonActive)}
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
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </nav>
  );
}
