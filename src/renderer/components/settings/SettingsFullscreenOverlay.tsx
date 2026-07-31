import { useEffect, useState, type JSX, type ReactNode } from "react";
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
  onVisibleChange?: (visible: boolean) => void;
}>;

type OverlayPhase = "closed" | "open";

/**
 * - Purpose: render fullscreen settings overlay synced with shell window layout (F-016).
 * - Inputs: open flag, close callback, window controls, panel content, visibility callback.
 * - Outputs: modal covering BrowserWindow; immediately unmounts on close.
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
      return "closed";
    });
  }, [open]);

  useEffect(() => {
    onVisibleChange?.(phase !== "closed");
  }, [onVisibleChange, phase]);

  if (phase === "closed") {
    return null;
  }

  const controls = (
    <ShellWindowControls
      platform={windowControls.platform}
      showNativeWindowControls={windowControls.showNativeWindowControls}
      isShuttingDown={windowControls.isShuttingDown}
      maximizeEnabled={windowControls.maximizeEnabled}
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
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
    >
      <Button
        variant="ghost"
        className={styles.backdrop}
        aria-label={t("settings.close")}
        data-testid="settings-overlay-backdrop"
        onClick={onClose}
      />
      <section className={styles.panel}>
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
