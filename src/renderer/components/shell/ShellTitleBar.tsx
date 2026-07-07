import type { JSX, ReactNode } from "react";
import { ShellWindowControls } from "./ShellWindowControls.js";
import type { ShellWindowControlsViewModel } from "../../hooks/useShellWindowControls.js";
import styles from "./ShellTitleBar.module.css";

export type ShellTitleBarProps = Readonly<{
  windowControls: ShellWindowControlsViewModel;
  leading: ReactNode;
  suppressWindowControls?: boolean;
}>;

/**
 * - Purpose: render native-like draggable titlebar with isolated shell controls.
 * - Inputs: leading header content and window controls view-model.
 * - Outputs: stacked titlebar separating window actions from header content.
 */
export function ShellTitleBar({
  windowControls,
  leading,
  suppressWindowControls = false,
}: ShellTitleBarProps): JSX.Element {
  const isMacOs = windowControls.platform === "darwin";
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

  if (isMacOs) {
    return (
      <div className={styles.titlebarMacOs} data-testid="shell-titlebar">
        {suppressWindowControls ? null : (
          <div className={styles.titlebarControlsRow}>
            <div className={styles.titlebarMacOsActions}>{controls}</div>
            <div className={styles.titlebarDragArea} aria-hidden="true" />
          </div>
        )}
        <div className={styles.titlebarDivider} aria-hidden="true" />
        <div className={styles.titlebarLeading}>{leading}</div>
      </div>
    );
  }

  return (
    <div className={styles.titlebar} data-testid="shell-titlebar">
      {suppressWindowControls ? null : (
        <div className={styles.titlebarControlsRow}>
          <div className={styles.titlebarDragArea} aria-hidden="true" />
          <div className={styles.titlebarControls}>{controls}</div>
        </div>
      )}
      <div className={styles.titlebarDivider} aria-hidden="true" />
      <div className={styles.titlebarLeading}>{leading}</div>
    </div>
  );
}
