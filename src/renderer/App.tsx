import type { JSX } from "react";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { useAppShutdown } from "./hooks/useAppShutdown.js";
import { useSoftphoneShellChrome } from "./hooks/useSoftphoneShellChrome.js";
import { useI18n } from "./i18n/index.js";
import { SoftphoneReadyShell } from "./shells/SoftphoneReadyShell.js";
import styles from "./App.module.css";

export function App(): JSX.Element {
  const { t } = useI18n();
  const { facade, status, errorMessage } = useAccountBootstrap();
  const shellChrome = useSoftphoneShellChrome({ facade });

  useAppShutdown({ facade });

  return (
    <main className={styles["shell"]} data-testid="softphone-shell">
      {status === "loading" && (
        <p data-testid="bootstrap-loading">{t("bootstrap.loading")}</p>
      )}

      {status === "error" && (
        <p className={styles["error"]} data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <SoftphoneReadyShell facade={facade} shellChrome={shellChrome} />
      )}
    </main>
  );
}
