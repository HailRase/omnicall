import type { JSX } from "react";
import { useAccountBootstrapStore } from "./stores/useAccountBootstrapStore.js";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { AuthStateView } from "./components/auth/AuthStateView.js";
import { AccountPanel } from "./components/account/AccountPanel.js";
import { PhoneStatusBadge } from "./components/status/PhoneStatusBadge.js";

function registrationLabel(
  registrationState: string,
  authUiState: string,
): string {
  if (authUiState === "sip_registering") {
    return "Registering";
  }

  switch (registrationState) {
    case "registered":
      return "Registered";
    case "failed":
      return "Failed";
    case "registering":
      return "Registering";
    default:
      return "Not registered";
  }
}

export function App(): JSX.Element {
  const { facade, status, errorMessage } = useAccountBootstrap();
  const projection = useAccountBootstrapStore((state) => state.projection);
  const applyPhoneStatus = useAccountBootstrapStore(
    (state) => state.applyPhoneStatus,
  );

  const showAccountPanel =
    projection.authUiState === "sip_only_ready" ||
    projection.authUiState === "sip_registration_failed" ||
    projection.authUiState === "sip_registered";

  const blockingAuthState =
    projection.authUiState === "ocp_authenticating" ||
    projection.authUiState === "ocp_session_exists" ||
    projection.authUiState === "ocp_invalid_token" ||
    projection.authUiState === "ocp_access_denied" ||
    projection.authUiState === "sip_registering";

  return (
    <main className="shell" data-testid="softphone-shell">
      <header className="shell__header">
        <h1 className="shell__title">Enterprise Softphone</h1>
        <p className="shell__subtitle">Authorization &amp; Account Bootstrap</p>
      </header>

      {status === "loading" && (
        <p data-testid="bootstrap-loading">Booting application…</p>
      )}

      {status === "error" && (
        <p className="shell__error" data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <>
          <AuthStateView
            state={projection.authUiState}
            lastError={projection.lastError}
          />

          <PhoneStatusBadge
            status={projection.phoneStatus}
            registrationLabel={registrationLabel(
              projection.registrationState,
              projection.authUiState,
            )}
            disabled={blockingAuthState}
            onChange={(nextStatus) => {
              applyPhoneStatus(nextStatus);
              void facade.setPhoneStatus(nextStatus);
            }}
          />

          {showAccountPanel && !blockingAuthState && (
            <AccountPanel facade={facade} />
          )}

          {projection.authUiState === "sip_registered" && (
            <p className="shell__hint" data-testid="sip-registered-hint">
              SIP account is registered via mock gateway (P01).
            </p>
          )}
        </>
      )}
    </main>
  );
}
