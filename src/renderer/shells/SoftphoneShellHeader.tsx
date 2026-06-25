import clsx from "clsx";
import type { JSX } from "react";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";
import { IconControlButton } from "../components/icons/index.js";
import { RegistrationStatusDot } from "../components/header/RegistrationStatusDot.js";
import { UserAvatar } from "../components/header/UserAvatar.js";
import styles from "./SoftphoneShellHeader.module.css";

type SoftphoneShellHeaderProps = Readonly<{
  headerChrome: HeaderChromeShellViewModel;
  collapsed: boolean;
  connectionRecoveryShell: ConnectionRecoveryShellResult;
  connectionRecoveryActions: ReturnType<typeof useConnectionRecoveryActions>;
  sessionLogoutActions: UseSessionLogoutActionsResult;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
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
  sessionLogoutActions,
  onToggleCollapse,
  onOpenSettings,
  onOpenDiagnostics,
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
            <UserAvatar initials={headerChrome.avatarInitials} />
            <RegistrationStatusDot
              variant={headerChrome.registrationDotVariant}
              label={headerChrome.registrationDotAriaLabel}
            />
          </div>
        </div>
        <div className={styles["headerActions"]}>
          <IconControlButton
            iconId="shell.settings"
            ariaLabel="Open settings"
            testId="control-open-settings"
            className={styles["iconActionButton"]}
            onClick={onOpenSettings}
          />
          <IconControlButton
            iconId="shell.diagnostics"
            ariaLabel="Open diagnostics"
            testId="control-open-diagnostics"
            className={styles["iconActionButton"]}
            onClick={onOpenDiagnostics}
          />
          <IconControlButton
            iconId={collapsed ? "shell.expand" : "shell.collapse"}
            ariaLabel={collapsed ? "Expand softphone" : "Collapse softphone"}
            testId="control-toggle-collapse"
            className={styles["iconActionButton"]}
            ariaExpanded={!collapsed}
            onClick={onToggleCollapse}
          />
        </div>
      </div>
      {!collapsed ? (
        <div className={styles["headerRecovery"]}>
          {connectionRecoveryShell.showReregisterSipControl ? (
            <IconControlButton
              iconId="sip.reregister"
              ariaLabel="Re-register SIP"
              testId="control-reregister-sip"
              className={styles["iconActionButton"]}
              disabledReason={connectionRecoveryShell.reregisterDisabledReason}
              onClick={connectionRecoveryActions.onReregisterSip}
            />
          ) : null}
          {sessionLogoutActions.shell.showEndSessionControl ? (
            <IconControlButton
              iconId="session.end"
              ariaLabel="End session"
              testId="control-end-session"
              className={styles["iconActionButton"]}
              disabledReason={sessionLogoutActions.shell.endSessionDisabledReason}
              onClick={sessionLogoutActions.handleEndSession}
            />
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
