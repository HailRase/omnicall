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
  const { isShuttingDown, shutdownErrorKey, shutdownProgressKey } = useAppShutdown({ facade });

  return (
    <main className={styles.shell} data-testid="softphone-shell">
      {shutdownProgressKey !== null ? (
        <div className={styles.shutdownProgress} data-testid="shutdown-progress" role="status">
          {t(shutdownProgressKey)}
        </div>
      ) : null}

      {shutdownErrorKey !== null ? (
        <div className={styles.shutdownError} data-testid="shutdown-error" role="alert">
          {t(shutdownErrorKey)}
        </div>
      ) : null}

      {status === "loading" && (
        <p data-testid="bootstrap-loading">{t("bootstrap.loading")}</p>
      )}

      {status === "error" && (
        <p className={styles.error} data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <SoftphoneReadyShell
          facade={facade}
          shellChrome={shellChrome}
          isShuttingDown={isShuttingDown}
        />
      )}
    </main>
  );
}
