import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { JSX } from "react";
import { AppIcon } from "../icons/index.js";
import { IconControlButton } from "../icons/index.js";
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
 * - Outputs: animated icon rail with optional expanded labels over content.
 */
export function SettingsSidebar({
  activeSection,
  expanded,
  onSectionChange,
  onToggleExpanded,
}: SettingsSidebarProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <nav
      className={styles["rail"]}
      data-testid="settings-sidebar"
      data-expanded={expanded ? "true" : "false"}
      aria-label="Разделы настроек"
    >
      <motion.div
        className={clsx(styles["panel"], expanded && styles["panelExpanded"])}
        initial={false}
        animate={{ width: expanded ? EXPANDED_WIDTH_PX : COLLAPSED_WIDTH_PX }}
        transition={transition}
      >
        <div className={clsx(styles["panelInner"], expanded && styles["panelInnerExpanded"])}>
          <div className={styles["toggleSlot"]}>
            <IconControlButton
              iconId={expanded ? "settings.nav.collapse" : "settings.nav.expand"}
              ariaLabel={expanded ? "Свернуть меню настроек" : "Развернуть меню настроек"}
              testId={expanded ? "settings-sidebar-collapse" : "settings-sidebar-expand"}
              className={styles["toggleButton"]}
              ariaExpanded={expanded}
              onClick={onToggleExpanded}
            />
          </div>
          <ul className={styles["navList"]} role="list">
            {SETTINGS_NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <li key={item.id} className={styles["navItem"]}>
                  <button
                    type="button"
                    className={clsx(styles["navButton"], isActive && styles["navButtonActive"])}
                    data-testid={item.testId}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    onClick={() => {
                      onSectionChange(item.id);
                    }}
                  >
                    <span className={styles["navIcon"]}>
                      <AppIcon id={item.iconId} decorative />
                    </span>
                    <motion.span
                      className={styles["navLabel"]}
                      initial={false}
                      animate={{
                        opacity: expanded ? 1 : 0,
                        maxWidth: expanded ? 140 : 0,
                      }}
                      transition={transition}
                      aria-hidden={!expanded}
                    >
                      {item.label}
                    </motion.span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </nav>
  );
}
