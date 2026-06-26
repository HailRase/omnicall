import clsx from "clsx";
import type { JSX } from "react";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseUserAvatarMenuActionsResult } from "../hooks/useUserAvatarMenuActions.js";
import type { UseUserAvatarMenuResult } from "../hooks/useUserAvatarMenu.js";
import { IconControlButton } from "../components/icons/index.js";
import { AvatarRecoveryRing } from "../components/header/AvatarRecoveryRing.js";
import { RegistrationStatusDot } from "../components/header/RegistrationStatusDot.js";
import { UserAvatar } from "../components/header/UserAvatar.js";
import { UserAvatarMenu } from "../components/header/UserAvatarMenu.js";
import styles from "./SoftphoneShellHeader.module.css";

type SoftphoneShellHeaderProps = Readonly<{
  headerChrome: HeaderChromeShellViewModel;
  collapsed: boolean;
  connectionRecoveryShell: ConnectionRecoveryShellResult;
  connectionRecoveryActions: ReturnType<typeof useConnectionRecoveryActions>;
  userAvatarMenu: UseUserAvatarMenuResult;
  userAvatarMenuActions: UseUserAvatarMenuActionsResult;
  onToggleCollapse: () => void;
}>;

/**
 * - Purpose: render global shell header with avatar, registration dot, and collapse toggle.
 * - Inputs: header chrome view-model, recovery/session shells, overlay and collapse callbacks.
 * - Outputs: legacy-inspired header bar with compact registration visibility (LF-011).
 * @uiMeta lf=LF-011,LF-076,LF-086 f=F-016 smoke=R7-*
 */
export function SoftphoneShellHeader({
  headerChrome,
  collapsed,
  connectionRecoveryShell,
  connectionRecoveryActions,
  userAvatarMenu,
  userAvatarMenuActions,
  onToggleCollapse,
}: SoftphoneShellHeaderProps): JSX.Element {
  return (
    <header
      className={clsx(styles["header"], collapsed && styles["headerCollapsed"])}
      data-testid="shell-header"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className={styles["headerBar"]}>
        <div className={styles["headerBrand"]}>
          <div className={styles["avatarGroup"]}>
          <AvatarRecoveryRing
            visible={connectionRecoveryShell.showAvatarRecoveryRing}
            tone={connectionRecoveryShell.avatarRecoveryRingTone}
            overlayMode={connectionRecoveryShell.avatarRecoveryOverlayMode}
            countdownSeconds={connectionRecoveryShell.reconnectCountdownSeconds}
            reloadDisabledReason={connectionRecoveryShell.reregisterDisabledReason}
            onReload={connectionRecoveryActions.onReregisterSip}
          >
            <UserAvatar
              ref={userAvatarMenu.anchorRef}
              initials={headerChrome.avatarInitials}
              ariaExpanded={userAvatarMenu.open}
              ariaHasPopup="menu"
              onClick={userAvatarMenu.toggle}
            />
            <RegistrationStatusDot
              variant={headerChrome.registrationDotVariant}
              label={headerChrome.registrationDotAriaLabel}
            />
          </AvatarRecoveryRing>
            <UserAvatarMenu
              open={userAvatarMenu.open}
              menuRef={userAvatarMenu.menuRef}
              position={userAvatarMenu.position}
              dndEnabled={userAvatarMenuActions.dndEnabled}
              dndDisabledReason={userAvatarMenuActions.dndDisabledReason}
              logoutDisabledReason={userAvatarMenuActions.logoutDisabledReason}
              onOpenSettings={userAvatarMenuActions.handleOpenSettings}
              onToggleDnd={userAvatarMenuActions.handleToggleDnd}
              onLogout={userAvatarMenuActions.handleLogout}
            />
          </div>
        </div>
        <div className={styles["headerActions"]}>
          <IconControlButton
            iconId={collapsed ? "shell.expand" : "shell.collapse"}
            ariaLabel={collapsed ? "Развернуть софтфон" : "Свернуть софтфон"}
            testId="control-toggle-collapse"
            className={styles["iconActionButton"]}
            ariaExpanded={!collapsed}
            onClick={onToggleCollapse}
          />
        </div>
      </div>
      {!collapsed && connectionRecoveryShell.showReregisterSipControl ? (
        <div className={styles["headerRecovery"]}>
          <IconControlButton
            iconId="sip.reregister"
            ariaLabel="Перерегистрация SIP"
            testId="control-reregister-sip"
            className={styles["iconActionButton"]}
            disabledReason={connectionRecoveryShell.reregisterDisabledReason}
            onClick={connectionRecoveryActions.onReregisterSip}
          />
        </div>
      ) : null}
    </header>
  );
}

