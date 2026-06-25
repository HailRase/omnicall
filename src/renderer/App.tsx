import { useMemo, type JSX } from "react";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { useAppShutdown } from "./hooks/useAppShutdown.js";
import { useConnectionRecoveryActions } from "./hooks/useConnectionRecoveryActions.js";
import { useConnectionRecoveryShell } from "./hooks/useConnectionRecoveryShell.js";
import { useSessionLogoutActions } from "./hooks/useSessionLogoutActions.js";
import { useAccountBootstrapStore } from "./stores/useAccountBootstrapStore.js";
import { SoftphoneReadyShell } from "./shells/SoftphoneReadyShell.js";
import { SoftphoneShellHeader } from "./shells/SoftphoneShellHeader.js";

export function App(): JSX.Element {
  const { facade, status, errorMessage } = useAccountBootstrap();
  const connectionRecoveryProjection = useAccountBootstrapStore(
    (state) => state.connectionRecoveryProjection,
  );
  const projection = useAccountBootstrapStore((state) => state.projection);
  const multiCallProjection = useAccountBootstrapStore(
    (state) => state.multiCallProjection,
  );
  const incomingCallProjection = useAccountBootstrapStore(
    (state) => state.incomingCallProjection,
  );
  const transferProjection = useAccountBootstrapStore((state) => state.transferProjection);
  const multiLineCallProjection = useAccountBootstrapStore(
    (state) => state.multiLineCallProjection,
  );

  const connectionRecoveryShell = useConnectionRecoveryShell(connectionRecoveryProjection);
  const connectionRecoveryActions = useConnectionRecoveryActions({
    facade,
    projection: connectionRecoveryProjection,
  });

  const sessionLogoutShellInput = useMemo(
    () => ({
      isOcpMode: projection.isOcpMode,
      authUiState: projection.authUiState,
      multiCallProjection,
      incomingCallProjection,
      transferProjection,
      multiLineCallProjection,
    }),
    [
      projection.isOcpMode,
      projection.authUiState,
      multiCallProjection,
      incomingCallProjection,
      transferProjection,
      multiLineCallProjection,
    ],
  );

  const sessionLogoutActions = useSessionLogoutActions({
    facade,
    shellInput: sessionLogoutShellInput,
  });

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
