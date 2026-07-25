import type { CSSProperties, JSX } from "react";
import { useLayoutEffect, useRef } from "react";
import { resolveBootstrapSplashAnimationDelayMs } from "@shared/platform/startupSplashColors.js";
import { useI18n } from "../i18n/index.js";
import { AppIcon } from "../components/icons/AppIcon.js";
import { Progress } from "../components/ui/progress/index.js";
import { dismissBootSplash } from "../helpers/bootSplashDom.js";
import styles from "./BootstrapSplashShell.module.css";

export type BootstrapSplashShellProps = Readonly<
  | {
      variant: "loading";
      /**
       * Determinate bootstrap progress in range 0–100.
       * When omitted, the bar stays indeterminate and the ball keeps bouncing.
       * At 100 the bounce settles at the landing pose.
       */
      progress?: number;
    }
  | {
      variant: "error";
      message: string;
    }
>;

function clampProgress(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

/**
 * - Purpose: presentational bootstrap splash with bouncing brand ball / init failure.
 * - Inputs: loading (+ optional progress) | error variant with message.
 * - Outputs: branded centered splash; no SIP/Electron/facade calls.
 * @uiMeta lf=LF-002 f=F-016
 */
export function BootstrapSplashShell(props: BootstrapSplashShellProps): JSX.Element {
  const { t } = useI18n();
  const isError = props.variant === "error";
  const progress =
    props.variant === "loading" && props.progress !== undefined
      ? clampProgress(props.progress)
      : null;
  const settled = progress !== null && progress >= 100;

  // Sync bounce phase with pre-React #boot-splash (same wall-clock modulo period).
  const bounceDelayStyleRef = useRef<CSSProperties | null>(null);
  if (bounceDelayStyleRef.current === null) {
    bounceDelayStyleRef.current = {
      animationDelay: `${resolveBootstrapSplashAnimationDelayMs()}ms`,
    };
  }
  const bounceDelayStyle = bounceDelayStyleRef.current;

  // Error (or Storybook) path: ensure the HTML single-stage splash is gone.
  useLayoutEffect(() => {
    dismissBootSplash();
  }, []);

  return (
    <div
      className={styles.root}
      data-testid={isError ? "bootstrap-error" : "bootstrap-loading"}
      data-settled={settled ? "true" : undefined}
      role={isError ? "alert" : "status"}
      aria-busy={isError ? undefined : true}
      aria-live={isError ? undefined : "polite"}
    >
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.content}>
        <div
          className={styles.ballStage}
          data-settled={settled ? "true" : undefined}
          data-testid="bootstrap-ball-stage"
          aria-hidden
        >
          <div className={styles.ball} style={settled ? undefined : bounceDelayStyle}>
            <AppIcon id="bootstrap.mark" size={36} decorative preferAnimated={false} />
          </div>
          <div className={styles.ballShadow} style={settled ? undefined : bounceDelayStyle} />
        </div>
        <p className={styles.brand}>{t("bootstrap.brand")}</p>
        {isError ? (
          <p className={styles.errorMessage}>{props.message}</p>
        ) : (
          <>
            <p className={styles.message}>{t("bootstrap.loading")}</p>
            <div className={styles.progress}>
              <Progress value={progress} aria-label={t("bootstrap.loading")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
