import type { JSX } from "react";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { useAppShutdown } from "./hooks/useAppShutdown.js";
import { useSoftphoneShellChrome } from "./hooks/useSoftphoneShellChrome.js";
import { SoftphoneReadyShell } from "./shells/SoftphoneReadyShell.js";
import { SoftphoneShellHeader } from "./shells/SoftphoneShellHeader.js";

export function App(): JSX.Element {
  const { facade, status, errorMessage } = useAccountBootstrap();
  const { connectionRecoveryShell, connectionRecoveryActions, sessionLogoutActions } =
    useSoftphoneShellChrome({ facade });

  useAppShutdown({ facade });

  return (
    <main className="shell" data-testid="softphone-shell">
      <SoftphoneShellHeader
        connectionRecoveryShell={connectionRecoveryShell}
        connectionRecoveryActions={connectionRecoveryActions}
        sessionLogoutActions={sessionLogoutActions}
      />

      {status === "loading" && (
        <p data-testid="bootstrap-loading">Booting application…</p>
      )}

      {status === "error" && (
        <p className="shell__error" data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <SoftphoneReadyShell facade={facade} sessionLogoutActions={sessionLogoutActions} />
      )}
    </main>
  );
}
