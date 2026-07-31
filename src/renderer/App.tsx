import type { JSX } from "react";
import { HashRouter } from "react-router-dom";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { useAppShutdown } from "./hooks/useAppShutdown.js";
import { useBootSplashController } from "./hooks/useBootSplashController.js";
import { useSoftphoneShellChrome } from "./hooks/useSoftphoneShellChrome.js";
import { useI18n } from "./i18n/index.js";
import { BootstrapSplashShell } from "./shells/BootstrapSplashShell.js";
import { SoftphoneReadyShell } from "./shells/SoftphoneReadyShell.js";
import styles from "./App.module.css";

export function App(): JSX.Element {
  const { t } = useI18n();
  const { facade, status, errorMessage } = useAccountBootstrap();
  const { showReadyShell } = useBootSplashController(status, t("bootstrap.loading"));
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

      {status === "error" ? (
        <BootstrapSplashShell
          variant="error"
          message={errorMessage ?? t("bootstrap.error.initializationFailed")}
        />
      ) : null}

      {showReadyShell && facade !== null ? (
        <HashRouter>
          <SoftphoneReadyShell
            facade={facade}
            shellChrome={shellChrome}
            isShuttingDown={isShuttingDown}
          />
        </HashRouter>
      ) : null}
    </main>
  );
}
