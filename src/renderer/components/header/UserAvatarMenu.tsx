import clsx from "clsx";
import type { JSX, RefObject } from "react";
import { createPortal } from "react-dom";
import type { SipStatusDotTone } from "@application/index.js";
import type { AnchoredMenuPosition } from "../../helpers/computeAnchoredMenuPosition.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconTooltip } from "../icons/index.js";
import { UserHeaderIdentity } from "./UserHeaderIdentity.js";
import styles from "./UserAvatarMenu.module.css";

export type UserAvatarMenuIdentity = Readonly<{
  displayName: string;
  sipStatusLabel: string;
  sipStatusTimerSuffix: string | null;
  sipStatusTone: SipStatusDotTone;
}>;

export type UserAvatarMenuProps = Readonly<{
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  position: AnchoredMenuPosition;
  identity: UserAvatarMenuIdentity | null;
  dndEnabled: boolean;
  dndDisabledReason: string | null;
  historyDisabledReason: string | null;
  contactsDisabledReason: string | null;
  logoutDisabledReason: string | null;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenContacts: () => void;
  onToggleDnd: () => void;
  onLogout: () => void;
}>;

/**
 * - Purpose: render auto-positioned user menu from avatar anchor.
 * - Inputs: open flag, position, optional identity header, DND/logout reasons, actions.
 * - Outputs: portal menu with non-selectable identity, then actions (settings/DND/logout).
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserAvatarMenu({
  open,
  menuRef,
  position,
  identity,
  dndEnabled,
  dndDisabledReason,
  historyDisabledReason,
  contactsDisabledReason,
  logoutDisabledReason,
  onOpenSettings,
  onOpenHistory,
  onOpenContacts,
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
      {identity !== null ? (
        <>
          <div
            className={styles.identityHeader}
            role="presentation"
            data-testid="user-menu-identity"
          >
            <UserHeaderIdentity
              variant="menu"
              displayName={identity.displayName}
              sipStatusLabel={identity.sipStatusLabel}
              sipStatusTimerSuffix={identity.sipStatusTimerSuffix}
              sipStatusTone={identity.sipStatusTone}
            />
          </div>
          <div className={styles.divider} role="separator" />
        </>
      ) : null}

      <IconTooltip label={contactsDisabledReason ?? ""} className={styles.itemTooltipHost}>
        <button
          type="button"
          role="menuitem"
          className={styles.item}
          data-testid="user-menu-open-contacts"
          disabled={contactsDisabledReason !== null}
          aria-label={contactsDisabledReason ?? t("contacts.title")}
          onClick={onOpenContacts}
        >
          <span className={styles.itemIcon}>
            <AppIcon id="settings.account" decorative />
          </span>
          <span className={styles.itemLabel}>{t("contacts.title")}</span>
        </button>
      </IconTooltip>

      <IconTooltip label={historyDisabledReason ?? ""} className={styles.itemTooltipHost}>
        <button
          type="button"
          role="menuitem"
          className={styles.item}
          data-testid="user-menu-open-history"
          disabled={historyDisabledReason !== null}
          aria-label={historyDisabledReason ?? t("history.title")}
          onClick={onOpenHistory}
        >
          <span className={styles.itemIcon}>
            <AppIcon id="call.outgoing" decorative />
          </span>
          <span className={styles.itemLabel}>{t("history.title")}</span>
        </button>
      </IconTooltip>

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
