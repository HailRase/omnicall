import clsx from "clsx";
import type { JSX, RefObject } from "react";
import { createPortal } from "react-dom";
import type { AnchoredMenuPosition } from "../../helpers/computeAnchoredMenuPosition.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconTooltip } from "../icons/index.js";
import styles from "./UserAvatarMenu.module.css";

export type UserAvatarMenuProps = Readonly<{
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  position: AnchoredMenuPosition;
  dndEnabled: boolean;
  dndDisabledReason: string | null;
  logoutDisabledReason: string | null;
  onOpenSettings: () => void;
  onToggleDnd: () => void;
  onLogout: () => void;
}>;

/**
 * - Purpose: render auto-positioned user menu from avatar anchor.
 * - Inputs: open flag, position, DND/logout disabled reasons, action callbacks.
 * - Outputs: portal menu with settings, DND toggle, and logout items.
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserAvatarMenu({
  open,
  menuRef,
  position,
  dndEnabled,
  dndDisabledReason,
  logoutDisabledReason,
  onOpenSettings,
  onToggleDnd,
  onLogout,
}: UserAvatarMenuProps): JSX.Element | null {
  const { t } = useI18n();
  if (!open || typeof document === "undefined") {
    return null;
  }

  const dndLabel = dndEnabled
    ? t("header.userMenu.dndDisable")
    : t("header.userMenu.dndEnable");
  const dndIconId = dndEnabled ? "phone.dnd.on" : "phone.dnd.off";

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      aria-label={t("header.userMenu.ariaLabel")}
      data-testid="user-avatar-menu"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        data-testid="user-menu-open-settings"
        onClick={onOpenSettings}
      >
        <span className={styles.itemIcon}>
          <AppIcon id="shell.settings" decorative />
        </span>
        <span className={styles.itemLabel}>{t("settings.title")}</span>
      </button>

      <IconTooltip label={dndDisabledReason ?? ""} className={styles.itemTooltipHost}>
        <button
          type="button"
          role="menuitem"
          className={clsx(styles.item, dndEnabled && styles.itemDndActive)}
          data-testid="user-menu-toggle-dnd"
          disabled={dndDisabledReason !== null}
          aria-label={dndDisabledReason ?? dndLabel}
          onClick={onToggleDnd}
        >
          <span className={styles.itemIcon}>
            <AppIcon id={dndIconId} decorative preferAnimated={false} />
          </span>
          <span className={styles.itemLabel}>{dndLabel}</span>
        </button>
      </IconTooltip>

      <div className={styles.divider} role="separator" />
      <IconTooltip label={logoutDisabledReason ?? ""} className={styles.itemTooltipHost}>
        <button
          type="button"
          role="menuitem"
          className={clsx(styles.item, styles.itemDanger)}
          data-testid="user-menu-logout"
          disabled={logoutDisabledReason !== null}
          aria-label={logoutDisabledReason ?? t("header.userMenu.logout")}
          onClick={onLogout}
        >
          <span className={styles.itemIcon}>
            <AppIcon id="session.end" decorative preferAnimated={false} />
          </span>
          <span className={styles.itemLabel}>{t("header.userMenu.logout")}</span>
        </button>
      </IconTooltip>
    </div>,
    document.body,
  );
}
