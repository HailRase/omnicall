import type { JSX } from "react";
import type { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import type { ConnectionRecoveryShellResult } from "../hooks/useConnectionRecoveryShell.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";

type SoftphoneShellHeaderProps = Readonly<{
  connectionRecoveryShell: ConnectionRecoveryShellResult;
  connectionRecoveryActions: ReturnType<typeof useConnectionRecoveryActions>;
  sessionLogoutActions: UseSessionLogoutActionsResult;
}>;

/**
 * - Purpose: render global shell header controls (re-register, end session).
 * - Inputs: recovery shell/actions and session logout actions.
 * - Outputs: header markup with global recovery and logout controls.
 */
export function SoftphoneShellHeader({
  connectionRecoveryShell,
  connectionRecoveryActions,
  sessionLogoutActions,
}: SoftphoneShellHeaderProps): JSX.Element {
  return (
    <header className="shell__header">
      <h1 className="shell__title">Enterprise Softphone</h1>
      <p className="shell__subtitle">Authorization &amp; Account Bootstrap</p>
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
    </header>
  );
}
