import type { SettingsNavigationAvailability } from "@application/index.js";
import clsx from "clsx";
import type { JSX } from "react";
import { AppIcon } from "../icons/index.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsNavGroup, SettingsNavLeaf, SettingsSectionId } from "./settingsSections.js";
import { isSettingsSectionInGroup } from "./settingsSections.js";
import {
  isNavGroupBlocked,
  resolveNavGroupDisabledReasonKey,
} from "./settingsNavGroupAvailability.js";
import styles from "./SettingsSidebar.module.css";

const NAV_ICON_SIZE = 16;

export type SettingsNavLeafItemProps = Readonly<{
  item: SettingsNavLeaf;
  activeSection: SettingsSectionId;
  expanded: boolean;
  sectionAvailability: SettingsNavigationAvailability;
  onSectionChange: (sectionId: SettingsSectionId) => void;
}>;

/**
 * - Purpose: render a top-level Settings sidebar leaf row.
 * - Inputs: leaf item, active section, expanded flag, availability, change callback.
 * - Outputs: enabled/disabled menu button with optional reason tooltip.
 */
export function SettingsNavLeafItem({
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
      data-settings-nav-interactive=""
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

export type SettingsNavGroupItemProps = Readonly<{
  group: SettingsNavGroup;
  activeSection: SettingsSectionId;
  expanded: boolean;
  sectionAvailability: SettingsNavigationAvailability;
  onGroupActivate: (group: SettingsNavGroup) => void;
  onSectionChange: (sectionId: SettingsSectionId) => void;
}>;

/**
 * - Purpose: render Integrations-style always-open cluster or collapsed group icon.
 * - Inputs: group node, active section, expanded flag, availability, activate/change callbacks.
 * - Outputs: collapsed icon button or expanded section label + flat children.
 */
export function SettingsNavGroupItem({
  group,
  activeSection,
  expanded,
  sectionAvailability,
  onGroupActivate,
  onSectionChange,
}: SettingsNavGroupItemProps): JSX.Element {
  const { t } = useI18n();
  const groupLabel = t(group.labelKey);
  const groupActive = isSettingsSectionInGroup(group, activeSection);
  const groupBlocked = isNavGroupBlocked(group, sectionAvailability);
  const groupDisabledReason = groupBlocked
    ? resolveNavGroupDisabledReasonKey(group, sectionAvailability)
    : null;
  const groupDisabledTooltip =
    groupDisabledReason !== null ? t(groupDisabledReason) : "";

  if (!expanded) {
    const groupButton = (
      <SidebarMenuButton
        isActive={groupActive}
        disabled={groupBlocked}
        {...(groupBlocked ? {} : { tooltip: groupLabel })}
        data-testid={group.testId}
        data-settings-nav-interactive=""
        aria-label={groupLabel}
        aria-disabled={groupBlocked || undefined}
        className={styles.menuButton}
        onClick={() => {
          onGroupActivate(group);
        }}
      >
        <span className={styles.iconSlot}>
          <AppIcon id={group.iconId} decorative size={NAV_ICON_SIZE} />
        </span>
        <span className={styles.label}>{groupLabel}</span>
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem>
        {groupBlocked && groupDisabledTooltip.length > 0 ? (
          <IconTooltip label={groupDisabledTooltip} placement="right">
            <span className={styles.disabledNavWrap}>{groupButton}</span>
          </IconTooltip>
        ) : (
          groupButton
        )}
      </SidebarMenuItem>
    );
  }

  const groupLabelControl = (
    <button
      type="button"
      className={clsx(styles.groupLabel, groupBlocked && styles.groupLabelBlocked)}
      data-testid={group.testId}
      data-settings-nav-interactive=""
      aria-label={groupLabel}
      aria-disabled={groupBlocked || undefined}
      disabled={groupBlocked}
      onClick={() => {
        onGroupActivate(group);
      }}
    >
      <span className={styles.groupLabelText}>{groupLabel}</span>
    </button>
  );

  return (
    <SidebarMenuItem className={styles.navGroup}>
      {groupBlocked && groupDisabledTooltip.length > 0 ? (
        <IconTooltip label={groupDisabledTooltip} placement="right">
          <span className={styles.disabledNavWrap}>{groupLabelControl}</span>
        </IconTooltip>
      ) : (
        groupLabelControl
      )}
      <SidebarMenuSub
        id={`settings-nav-group-${group.id}`}
        className={styles.subMenu}
        data-testid={`settings-nav-group-${group.id}`}
      >
        {group.children.map((child) => (
          <SettingsNavChildItem
            key={child.id}
            item={child}
            activeSection={activeSection}
            sectionAvailability={sectionAvailability}
            onSectionChange={onSectionChange}
          />
        ))}
      </SidebarMenuSub>
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
      className={clsx(styles.childButton, isActive && styles.childButtonActive)}
      data-testid={item.testId}
      data-settings-nav-interactive=""
      data-active={isActive ? "true" : undefined}
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
        <AppIcon id={item.iconId} decorative size={NAV_ICON_SIZE} />
      </span>
      <span className={styles.childLabel}>{sectionLabel}</span>
    </button>
  );

  return (
    <SidebarMenuSubItem>
      {blocked && disabledReason.length > 0 ? (
        <IconTooltip label={disabledReason} placement="right">
          <span className={styles.disabledNavWrap}>{childButton}</span>
        </IconTooltip>
      ) : (
        childButton
      )}
    </SidebarMenuSubItem>
  );
}
