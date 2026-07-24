import type { JSX } from "react";
import { useI18n } from "../i18n/index.js";
import { AppIcon } from "../components/icons/AppIcon.js";
import { Progress } from "../components/ui/progress/index.js";
import styles from "./BootstrapSplashShell.module.css";

export type BootstrapSplashShellProps = Readonly<
  | {
      variant: "loading";
    }
  | {
      variant: "error";
      message: string;
    }
>;

/**
 * - Purpose: presentational macOS-like bootstrap splash for app loading / init failure.
 * - Inputs: loading | error variant; error message when failed.
 * - Outputs: branded centered splash; no SIP/Electron/facade calls.
 * @uiMeta lf=LF-002 f=F-016
 */
export function BootstrapSplashShell(props: BootstrapSplashShellProps): JSX.Element {
  const { t } = useI18n();
  const isError = props.variant === "error";

  return (
    <div
      className={styles.root}
      data-testid={isError ? "bootstrap-error" : "bootstrap-loading"}
      role={isError ? "alert" : "status"}
      aria-busy={isError ? undefined : true}
      aria-live={isError ? undefined : "polite"}
    >
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.content}>
        <div className={styles.mark} aria-hidden>
          <span className={styles.markGlow} />
          <span className={styles.markCore}>
            <AppIcon id="dial.call" size={28} decorative />
          </span>
        </div>
        <p className={styles.brand}>{t("bootstrap.brand")}</p>
        {isError ? (
          <p className={styles.errorMessage}>{props.message}</p>
        ) : (
          <>
            <p className={styles.message}>{t("bootstrap.loading")}</p>
            <div className={styles.progress}>
              <Progress value={null} aria-label={t("bootstrap.loading")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
