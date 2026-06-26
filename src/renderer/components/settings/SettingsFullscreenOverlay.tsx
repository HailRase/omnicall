import clsx from "clsx";
import { useEffect, useState, type AnimationEvent, type JSX, type ReactNode } from "react";
import styles from "./SettingsFullscreenOverlay.module.css";

export type SettingsFullscreenOverlayProps = Readonly<{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}>;

type OverlayPhase = "closed" | "open" | "closing";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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
  const [phase, setPhase] = useState<OverlayPhase>(() => (open ? "open" : "closed"));

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

  return (
    <div
      className={styles["overlay"]}
      data-testid="settings-overlay"
      data-closing={exiting ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <button
        type="button"
        className={clsx(styles["backdrop"], exiting && styles["backdropExiting"])}
        aria-label="Закрыть настройки"
        data-testid="settings-overlay-backdrop"
        onClick={onClose}
      />
      <section
        className={clsx(styles["panel"], exiting && styles["panelExiting"])}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        {children}
      </section>
    </div>
  );
}
