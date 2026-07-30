import clsx from "clsx";
import { useEffect, useState, type JSX, type ReactNode } from "react";
import { SETTINGS_SHELL_LAYOUT_ANIMATION_MS } from "@application/index.js";
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
  /** Fires when overlay mounts/unmounts visually (includes opaque close hold). */
  onVisibleChange?: (visible: boolean) => void;
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
 * - Purpose: render fullscreen settings overlay synced with shell window layout (F-016).
 * - Inputs: open flag, close callback, window controls, panel content, visibility callback.
 * - Outputs: modal covering BrowserWindow; opaque hold while window shrinks on close.
 * - Rule: no opacity exit fade — window bounds animation is the close motion carrier.
 * @uiMeta f=F-016,F-017 smoke=settings-overlay
 */
export function SettingsFullscreenOverlay({
  open,
  onClose,
  windowControls,
  children,
  onVisibleChange,
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

  useEffect(() => {
    if (phase !== "closing") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase("closed");
    }, SETTINGS_SHELL_LAYOUT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [phase]);

  useEffect(() => {
    onVisibleChange?.(phase !== "closed");
  }, [onVisibleChange, phase]);

  if (phase === "closed") {
    return null;
  }

  const exiting = phase === "closing";
  const controls = (
    <ShellWindowControls
      platform={windowControls.platform}
      showNativeWindowControls={windowControls.showNativeWindowControls}
      isShuttingDown={windowControls.isShuttingDown}
      maximizeEnabled={windowControls.maximizeEnabled && !exiting}
      isMaximized={windowControls.isMaximized}
      onMinimize={windowControls.onMinimize}
      onClose={windowControls.onClose}
      onRestart={windowControls.onRestart}
      onToggleMaximize={windowControls.onToggleMaximize}
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
        className={clsx(styles.backdrop, exiting && styles.backdropHolding)}
        aria-label={t("settings.close")}
        data-testid="settings-overlay-backdrop"
        disabled={exiting}
        onClick={onClose}
      />
      <section className={clsx(styles.panel, exiting && styles.panelHolding)}>
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
