import type { JSX } from "react";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseUserAvatarMenuActionsResult } from "../hooks/useUserAvatarMenuActions.js";
import type { UseUserAvatarMenuResult } from "../hooks/useUserAvatarMenu.js";
import { IconControlButton } from "../components/icons/index.js";
import { RegistrationStatusDot } from "../components/header/RegistrationStatusDot.js";
import { UserAvatar } from "../components/header/UserAvatar.js";
import { UserAvatarMenu } from "../components/header/UserAvatarMenu.js";
import styles from "./SoftphoneShellHeader.module.css";

type SoftphoneShellHeaderProps = Readonly<{
  headerChrome: HeaderChromeShellViewModel;
  connectionRecoveryShell: ConnectionRecoveryShellResult;
  connectionRecoveryActions: ReturnType<typeof useConnectionRecoveryActions>;
  userAvatarMenu: UseUserAvatarMenuResult;
  userAvatarMenuActions: UseUserAvatarMenuActionsResult;
}>;

/**
 * - Purpose: render global shell header with avatar and registration dot.
 * - Inputs: header chrome view-model, recovery/session shells, menu callbacks.
 * - Outputs: header bar with compact registration visibility (LF-011).
 * @uiMeta lf=LF-011,LF-076,LF-086 f=F-016 smoke=R7-*
 */
export function SoftphoneShellHeader({
  headerChrome,
  connectionRecoveryShell,
  connectionRecoveryActions,
  userAvatarMenu,
  userAvatarMenuActions,
}: SoftphoneShellHeaderProps): JSX.Element {
  return (
    <header className={styles["header"]} data-testid="shell-header">
      <div className={styles["headerBar"]}>
        <div className={styles["headerBrand"]}>
          <div className={styles["avatarGroup"]}>
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
      </div>
      {connectionRecoveryShell.showReregisterSipControl ? (
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
