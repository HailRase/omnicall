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
          title="Загрузка"
          message="Выполняется авторизация…"
        />
      );
    case "ocp_session_exists":
      return (
        <AuthScreen
          testId="auth-session-exists"
          title="Сессия уже существует"
          message={lastError ?? "Активна другая сессия OCP."}
        />
      );
    case "ocp_invalid_token":
      return (
        <AuthScreen
          testId="auth-invalid-token"
          title="Недействительный токен"
          message={lastError ?? "Токен OCP недействителен."}
        />
      );
    case "access_denied":
      return (
        <AuthScreen
          testId="auth-access-denied"
          title="Доступ запрещён"
          message={lastError ?? "Доступ запрещён: нет корректной учётной записи."}
        />
      );
    case "sip_registration_failed":
      return (
        <AuthScreen
          testId="auth-registration-failed"
          title="Ошибка регистрации"
          message={lastError ?? "Не удалось зарегистрировать SIP."}
        />
      );
    default:
      return null;
  }
}
