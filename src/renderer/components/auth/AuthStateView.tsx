import type { JSX } from "react";
import type { AuthUiState } from "@application/projections/accountBootstrapProjection.js";
import panelStyles from "../shell/BootstrapPanel.module.css";
import styles from "./AuthStateView.module.css";

type AuthScreenProps = Readonly<{
  title: string;
  message: string;
  testId: string;
}>;

function AuthScreen({ title, message, testId }: AuthScreenProps): JSX.Element {
  return (
    <section className={panelStyles["panel"]} data-testid={testId}>
      <h2 className={styles["title"]}>{title}</h2>
      <p className={styles["message"]}>{message}</p>
    </section>
  );
}

type AuthStateViewProps = Readonly<{
  state: AuthUiState;
  lastError: string | null;
}>;

export function AuthStateView({
  state,
  lastError,
}: AuthStateViewProps): JSX.Element | null {
  switch (state) {
    case "booting":
    case "ocp_authenticating":
    case "sip_registering":
      return (
        <AuthScreen
          testId="auth-loading"
          title="Loading"
          message="Authorization in progress…"
        />
      );
    case "ocp_session_exists":
      return (
        <AuthScreen
          testId="auth-session-exists"
          title="Session already exists"
          message={lastError ?? "Another OCP session is active."}
        />
      );
    case "ocp_invalid_token":
      return (
        <AuthScreen
          testId="auth-invalid-token"
          title="Invalid token"
          message={lastError ?? "OCP token is invalid."}
        />
      );
    case "access_denied":
      return (
        <AuthScreen
          testId="auth-access-denied"
          title="Access denied"
          message={lastError ?? "Access denied without valid account identity."}
        />
      );
    case "sip_registration_failed":
      return (
        <AuthScreen
          testId="auth-registration-failed"
          title="Registration failed"
          message={lastError ?? "SIP registration failed."}
        />
      );
    default:
      return null;
  }
}
