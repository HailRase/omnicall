import type { JSX, ReactNode } from "react";
import { IconControlButton } from "../icons/index.js";
import styles from "./SettingsFullscreenOverlay.module.css";

export type SettingsFullscreenOverlayProps = Readonly<{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}>;

/**
 * - Purpose: render fullscreen settings overlay with slide-in animation and scrim.
 * - Inputs: open flag, close callback, settings panel content.
 * - Outputs: modal dialog covering BrowserWindow without unmounting call context.
 * @uiMeta f=F-016,F-017 smoke=settings-overlay
 */
export function SettingsFullscreenOverlay({
  open,
  onClose,
  children,
}: SettingsFullscreenOverlayProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div
      className={styles["overlay"]}
      data-testid="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <button
        type="button"
        className={styles["backdrop"]}
        aria-label="Закрыть настройки"
        data-testid="settings-overlay-backdrop"
        onClick={onClose}
      />
      <section className={styles["panel"]}>
        <header className={styles["header"]}>
          <h2 className={styles["title"]}>Настройки</h2>
          <IconControlButton
            iconId="overlay.close"
            ariaLabel="Закрыть настройки"
            testId="settings-overlay-close"
            className={styles["closeButton"]}
            onClick={onClose}
          />
        </header>
        <div className={styles["body"]}>{children}</div>
      </section>
    </div>
  );
}
