import type { JSX } from "react";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";
import { RegistrationStatusDot } from "../components/header/RegistrationStatusDot.js";
import { UserAvatar } from "../components/header/UserAvatar.js";

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
      className={`shell__header${collapsed ? " shell__header--collapsed" : ""}`}
      data-testid="shell-header"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className="shell__header-bar">
        <div className="shell__header-brand">
          <div className="shell__avatar-group">
            <UserAvatar initials={headerChrome.avatarInitials} />
            <RegistrationStatusDot
              variant={headerChrome.registrationDotVariant}
              label={headerChrome.registrationDotAriaLabel}
            />
          </div>
        </div>
        <div className="shell__header-actions">
          <button
            type="button"
            className="shell__header-action"
            data-testid="control-open-settings"
            aria-label="Open settings"
            onClick={onOpenSettings}
          >
            Settings
          </button>
          <button
            type="button"
            className="shell__header-action"
            data-testid="control-open-diagnostics"
            aria-label="Open diagnostics"
            onClick={onOpenDiagnostics}
          >
            Diagnostics
          </button>
          <button
            type="button"
            className="shell__header-action shell__header-action--collapse"
            data-testid="control-toggle-collapse"
            aria-label={collapsed ? "Expand softphone" : "Collapse softphone"}
            aria-expanded={!collapsed}
            onClick={onToggleCollapse}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
      {!collapsed ? (
        <div className="shell__header-recovery">
          {connectionRecoveryShell.showReregisterSipControl ? (
            <button
              type="button"
              className="shell__reregister"
              data-testid="control-reregister-sip"
              aria-label="Re-register SIP"
              disabled={connectionRecoveryShell.reregisterDisabledReason !== null}
              title={connectionRecoveryShell.reregisterDisabledReason ?? undefined}
              onClick={connectionRecoveryActions.onReregisterSip}
            >
              Re-register SIP
            </button>
          ) : null}
          {sessionLogoutActions.shell.showEndSessionControl ? (
            <button
              type="button"
              className="shell__end-session"
              data-testid="control-end-session"
              aria-label="End session"
              disabled={sessionLogoutActions.shell.endSessionDisabledReason !== null}
              title={sessionLogoutActions.shell.endSessionDisabledReason ?? undefined}
              onClick={sessionLogoutActions.handleEndSession}
            >
              End session
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
