import clsx from "clsx";
import type { JSX } from "react";
import { IconControlButton } from "../icons/IconControlButton.js";
import { useI18n } from "../../i18n/index.js";
import styles from "./ShellWindowControls.module.css";

export type ShellWindowControlsProps = Readonly<{
  platform: "win32" | "darwin" | "linux";
  showNativeWindowControls: boolean;
  isShuttingDown: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestart: () => void;
}>;

/**
 * - Purpose: render custom shell window controls with reload instead of maximize (F-016).
 * - Inputs: platform visibility flag, shutdown state, and control callbacks.
 * - Outputs: draggable-safe window control buttons for frameless shell.
 * @uiMeta lf=LF-079 f=F-016
 */
export function ShellWindowControls({
  platform,
  showNativeWindowControls,
  isShuttingDown,
  onMinimize,
  onClose,
  onRestart,
}: ShellWindowControlsProps): JSX.Element {
  const { t } = useI18n();
  const isMacOs = platform === "darwin";

  return (
    <div
      className={clsx(
        styles.controls,
        showNativeWindowControls ? styles.controlsFrameless : styles.controlsMacOs,
      )}
      data-testid="shell-window-controls"
    >
      {showNativeWindowControls ? (
        <IconControlButton
          iconId="shell.window.minimize"
          preferAnimated={false}
          ariaLabel={t("shell.window.minimizeAria")}
          tooltipLabel={t("shell.window.minimizeAria")}
          testId="control-window-minimize"
          disabled={isShuttingDown}
          onClick={onMinimize}
          className={styles.windowControlButton}
        />
      ) : null}
      <IconControlButton
        iconId="shell.restart"
        preferAnimated={false}
        ariaLabel={t("shell.window.restartAria")}
        tooltipLabel={
          isShuttingDown ? t("shell.window.restartInProgressAria") : t("shell.window.restartAria")
        }
        testId="control-window-restart"
        disabled={isShuttingDown}
        onClick={onRestart}
        className={clsx(
          styles.windowControlButton,
          isMacOs && styles.windowControlButtonMacOs,
          showNativeWindowControls && styles.windowControlButtonRestart,
        )}
      />
      {showNativeWindowControls ? (
        <IconControlButton
          iconId="shell.window.close"
          preferAnimated={false}
          ariaLabel={t("shell.window.closeAria")}
          tooltipLabel={t("shell.window.closeAria")}
          testId="control-window-close"
          disabled={isShuttingDown}
          onClick={onClose}
          className={clsx(styles.windowControlButton, styles.windowControlButtonClose)}
        />
      ) : null}
    </div>
  );
}
