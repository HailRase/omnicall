import clsx from "clsx";
import type { JSX } from "react";
import { AppIcon } from "../icons/AppIcon.js";
import { IconControlButton } from "../icons/IconControlButton.js";
import { useI18n } from "../../i18n/index.js";
import styles from "./ShellWindowControls.module.css";

export type ShellWindowControlsProps = Readonly<{
  platform: "win32" | "darwin" | "linux";
  showNativeWindowControls: boolean;
  isShuttingDown: boolean;
  maximizeEnabled?: boolean;
  isMaximized?: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestart: () => void;
  onToggleMaximize?: () => void;
}>;

type MacOsTrafficLightProps = Readonly<{
  variant: "close" | "minimize" | "restart" | "maximize";
  ariaLabel: string;
  testId: string;
  disabled: boolean;
  onClick: () => void;
}>;

function MacOsTrafficLight({
  variant,
  ariaLabel,
  testId,
  disabled,
  onClick,
}: MacOsTrafficLightProps): JSX.Element {
  const isRestart = variant === "restart";
  const isMaximize = variant === "maximize";

  return (
    <button
      type="button"
      className={clsx(
        styles.trafficLight,
        variant === "close" && styles.trafficLightClose,
        variant === "minimize" && styles.trafficLightMinimize,
        isRestart && styles.trafficLightRestart,
        isMaximize && styles.trafficLightMaximize,
      )}
      data-testid={testId}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {isRestart ? (
        <AppIcon
          id="shell.restart"
          size={7}
          preferAnimated={false}
          className={styles.trafficLightRestartGlyph}
        />
      ) : isMaximize ? (
        <AppIcon
          id="shell.window.maximize"
          size={7}
          preferAnimated={false}
          className={styles.trafficLightGlyph}
        />
      ) : (
        <AppIcon
          id={variant === "close" ? "shell.window.close" : "shell.window.minimize"}
          size={8}
          preferAnimated={false}
          className={styles.trafficLightGlyph}
        />
      )}
    </button>
  );
}

function MacOsShellWindowControls({
  isShuttingDown,
  maximizeEnabled,
  isMaximized,
  onMinimize,
  onClose,
  onRestart,
  onToggleMaximize,
}: Omit<ShellWindowControlsProps, "platform" | "showNativeWindowControls">): JSX.Element {
  const { t } = useI18n();
  const showMaximize = maximizeEnabled === true;

  return (
    <div
      className={clsx(styles.controls, styles.controlsMacOs, styles.controlsMacOsTrafficLights)}
      data-testid="shell-window-controls"
    >
      <MacOsTrafficLight
        variant="close"
        ariaLabel={t("shell.window.closeAria")}
        testId="control-window-close"
        disabled={isShuttingDown}
        onClick={onClose}
      />
      <MacOsTrafficLight
        variant="minimize"
        ariaLabel={t("shell.window.minimizeAria")}
        testId="control-window-minimize"
        disabled={isShuttingDown}
        onClick={onMinimize}
      />
      {showMaximize ? (
        <MacOsTrafficLight
          variant="maximize"
          ariaLabel={
            isMaximized === true
              ? t("shell.window.restoreAria")
              : t("shell.window.maximizeAria")
          }
          testId="control-window-maximize"
          disabled={isShuttingDown}
          onClick={() => {
            onToggleMaximize?.();
          }}
        />
      ) : (
        <MacOsTrafficLight
          variant="restart"
          ariaLabel={t("shell.window.restartAria")}
          testId="control-window-restart"
          disabled={isShuttingDown}
          onClick={onRestart}
        />
      )}
      {showMaximize ? (
        <IconControlButton
          iconId="shell.restart"
          preferAnimated={false}
          ariaLabel={t("shell.window.restartAria")}
          tooltipLabel={
            isShuttingDown
              ? t("shell.window.restartInProgressAria")
              : t("shell.window.restartAria")
          }
          testId="control-window-restart"
          disabled={isShuttingDown}
          onClick={onRestart}
          className={styles.macOsRestartAfterTrafficLights}
        />
      ) : null}
    </div>
  );
}

/**
 * - Purpose: render custom shell window controls; settings-only maximize (F-016).
 * - Inputs: platform visibility, shutdown, maximize state, and control callbacks.
 * - Outputs: draggable-safe window control buttons for frameless shell.
 * @uiMeta lf=LF-079 f=F-016
 */
export function ShellWindowControls({
  platform,
  showNativeWindowControls,
  isShuttingDown,
  maximizeEnabled = false,
  isMaximized = false,
  onMinimize,
  onClose,
  onRestart,
  onToggleMaximize,
}: ShellWindowControlsProps): JSX.Element {
  const { t } = useI18n();
  const isMacOs = platform === "darwin";
  const showMaximize = maximizeEnabled;

  if (isMacOs) {
    return (
      <MacOsShellWindowControls
        isShuttingDown={isShuttingDown}
        maximizeEnabled={maximizeEnabled}
        isMaximized={isMaximized}
        onMinimize={onMinimize}
        onClose={onClose}
        onRestart={onRestart}
        {...(onToggleMaximize !== undefined ? { onToggleMaximize } : {})}
      />
    );
  }

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
      {showNativeWindowControls && showMaximize ? (
        <IconControlButton
          iconId={isMaximized ? "shell.window.restore" : "shell.window.maximize"}
          preferAnimated={false}
          ariaLabel={
            isMaximized ? t("shell.window.restoreAria") : t("shell.window.maximizeAria")
          }
          tooltipLabel={
            isMaximized ? t("shell.window.restoreAria") : t("shell.window.maximizeAria")
          }
          testId="control-window-maximize"
          disabled={isShuttingDown}
          onClick={() => {
            onToggleMaximize?.();
          }}
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
        className={clsx(styles.windowControlButton, styles.windowControlButtonRestart)}
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
