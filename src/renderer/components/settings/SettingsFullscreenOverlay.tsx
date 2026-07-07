import clsx from "clsx";
import { useEffect, useState, type AnimationEvent, type JSX, type ReactNode } from "react";
import { useI18n } from "../../i18n/index.js";
import { Button } from "../ui/index.js";
import { ShellWindowControls } from "../shell/ShellWindowControls.js";
import type { ShellWindowControlsViewModel } from "../../hooks/useShellWindowControls.js";
import styles from "./SettingsFullscreenOverlay.module.css";

export type SettingsFullscreenOverlayProps = Readonly<{
  open: boolean;
  onClose: () => void;
  windowControls: ShellWindowControlsViewModel;
  children: ReactNode;
}>;

type OverlayPhase = "closed" | "open" | "closing";
const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion:" + " reduce)";

function prefersReducedMotion(): boolean {
  if (typeof window === typeof void 0 || window.matchMedia === undefined) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;
}

/**
 * - Purpose: render fullscreen settings overlay with slide-in animation and scrim.
 * - Inputs: open flag, close callback, window controls view-model, settings panel content.
 * - Outputs: modal dialog covering BrowserWindow without unmounting call context.
 * - Rule: settings remain a blocking fullscreen modal above route sidebars; call zones stay mounted.
 * @uiMeta f=F-016,F-017 smoke=settings-overlay
 */
export function SettingsFullscreenOverlay({
  open,
  onClose,
  windowControls,
  children,
}: SettingsFullscreenOverlayProps): JSX.Element | null {
  const { t } = useI18n();
  const [phase, setPhase] = useState<OverlayPhase>(() => (open ? "open" : "closed"));
  const isMacOs = windowControls.platform === "darwin";

  useEffect(() => {
    if (open) {
      setPhase("open");
      return;
    }

    setPhase((current) => {
      if (current !== "open") {
        return current;
      }
      return prefersReducedMotion() ? "closed" : "closing";
    });
  }, [open]);

  const handlePanelAnimationEnd = (event: AnimationEvent<HTMLElement>): void => {
    if (phase !== "closing" || event.target !== event.currentTarget) {
      return;
    }
    setPhase("closed");
  };

  if (phase === "closed") {
    return null;
  }

  const exiting = phase === "closing";
  const controls = (
    <ShellWindowControls
      platform={windowControls.platform}
      showNativeWindowControls={windowControls.showNativeWindowControls}
      isShuttingDown={windowControls.isShuttingDown}
      onMinimize={windowControls.onMinimize}
      onClose={windowControls.onClose}
      onRestart={windowControls.onRestart}
    />
  );

  return (
    <div
      className={styles.overlay}
      data-testid="settings-overlay"
      data-shell-overlay-interactive="true"
      data-closing={exiting ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
    >
      <Button
        variant="ghost"
        className={clsx(styles.backdrop, exiting && styles.backdropExiting)}
        aria-label={t("settings.close")}
        data-testid="settings-overlay-backdrop"
        onClick={onClose}
      />
      <section
        className={clsx(styles.panel, exiting && styles.panelExiting)}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <div className={styles.panelChromeTitlebar} data-testid="settings-overlay-chrome-titlebar">
          {isMacOs ? (
            <>
              <div className={styles.panelChromeActions}>{controls}</div>
              <div className={styles.panelChromeDrag} aria-hidden="true" />
            </>
          ) : (
            <>
              <div className={styles.panelChromeDrag} aria-hidden="true" />
              <div className={styles.panelChromeActions}>{controls}</div>
            </>
          )}
        </div>
        <div className={styles.panelBody}>{children}</div>
      </section>
    </div>
  );
}
