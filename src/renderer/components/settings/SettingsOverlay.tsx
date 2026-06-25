import type { ChangeEvent, JSX } from "react";
import styles from "./SettingsOverlay.module.css";

export type SettingsOverlayProps = Readonly<{
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
  updateError?: string | null;
}>;

/**
 * - Purpose: present user settings controls inside the settings overlay sheet.
 * - Inputs: multi-sessions flag and change callback from settings actions hook.
 * - Outputs: accessible settings form without facade or repository access.
 * @uiMeta lf=LF-032,LF-076 f=F-016 smoke=R7-5
 */
export function SettingsOverlay({
  multiSessionsEnabled,
  onMultiSessionsChange,
  updateError = null,
}: SettingsOverlayProps): JSX.Element {
  const handleMultiSessionsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onMultiSessionsChange(event.target.checked);
  };

  return (
    <form className={styles["overlay"]} data-testid="settings-overlay-body">
      {updateError !== null && (
        <p className={styles["error"]} role="alert" data-testid="settings-update-error">
          {updateError}
        </p>
      )}
      <fieldset className={styles["fieldset"]}>
        <legend className={styles["legend"]}>Call sessions</legend>
        <label className={styles["toggle"]} htmlFor="settings-multi-sessions">
          <input
            id="settings-multi-sessions"
            type="checkbox"
            className={styles["checkbox"]}
            data-testid="settings-multi-sessions-toggle"
            checked={multiSessionsEnabled}
            onChange={handleMultiSessionsChange}
          />
          <span className={styles["toggleLabel"]}>Allow multiple call sessions</span>
        </label>
        <p className={styles["hint"]} data-testid="settings-multi-sessions-hint">
          When disabled, a second incoming or outgoing call is blocked while a call is active.
        </p>
      </fieldset>
    </form>
  );
}
