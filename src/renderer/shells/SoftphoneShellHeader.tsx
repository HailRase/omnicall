import type { JSX } from "react";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";

type SoftphoneShellHeaderProps = Readonly<{
  connectionRecoveryShell: ConnectionRecoveryShellResult;
  connectionRecoveryActions: ReturnType<typeof useConnectionRecoveryActions>;
  sessionLogoutActions: UseSessionLogoutActionsResult;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
}>;

/**
 * - Purpose: render global shell header controls and overlay entry points.
 * - Inputs: recovery shell/actions, session logout actions, overlay open callbacks.
 * - Outputs: header markup with global recovery, logout, settings, and diagnostics controls.
 */
export function SoftphoneShellHeader({
  connectionRecoveryShell,
  connectionRecoveryActions,
  sessionLogoutActions,
  onOpenSettings,
  onOpenDiagnostics,
}: SoftphoneShellHeaderProps): JSX.Element {
  return (
    <header className="shell__header">
      <div className="shell__header-top">
        <div>
          <h1 className="shell__title">Enterprise Softphone</h1>
          {import.meta.env.DEV && (
            <p className="shell__subtitle">Authorization &amp; Account Bootstrap</p>
          )}
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
        </div>
      </div>
      <div className="shell__header-recovery">
        {connectionRecoveryShell.showReregisterSipControl && (
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
        )}
        {sessionLogoutActions.shell.showEndSessionControl && (
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
        )}
      </div>
    </header>
  );
}
