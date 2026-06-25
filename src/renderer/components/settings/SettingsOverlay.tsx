import type { ChangeEvent, JSX } from "react";
import { MIN_SIP_REREGISTER_INTERVAL_SEC } from "@application/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./SettingsOverlay.module.css";

export type SettingsOverlayProps = Readonly<{
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
  sipAutoReregisterEnabled: boolean;
  onSipAutoReregisterChange: (enabled: boolean) => void;
  sipReregisterIntervalSec: number;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
  updateError?: string | null;
}>;

/**
 * - Purpose: present user settings controls inside the settings overlay sheet.
 * - Inputs: multi-sessions and SIP recovery settings with change callbacks.
 * - Outputs: accessible settings form without facade or repository access.
 * @uiMeta lf=LF-032,LF-076,LF-008 f=F-016,F-014 smoke=R7-5
 */
export function SettingsOverlay({
  multiSessionsEnabled,
  onMultiSessionsChange,
  sipAutoReregisterEnabled,
  onSipAutoReregisterChange,
  sipReregisterIntervalSec,
  onSipReregisterIntervalChange,
  updateError = null,
}: SettingsOverlayProps): JSX.Element {
  const handleMultiSessionsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onMultiSessionsChange(event.target.checked);
  };

  const handleSipAutoReregisterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSipAutoReregisterChange(event.target.checked);
  };

  const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const parsed = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    onSipReregisterIntervalChange(parsed);
  };

  return (
    <form className={styles["overlay"]} data-testid="settings-overlay-body">
      {updateError !== null && (
        <p className={styles["error"]} role="alert" data-testid="settings-update-error">
          {updateError}
        </p>
      )}
      <fieldset className={styles["fieldset"]}>
        <legend className={styles["legend"]}>
          <span className={styles["legendIcon"]}>
            <AppIcon id="shell.settings" decorative />
          </span>
          Call sessions
        </legend>
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

      <fieldset className={styles["fieldset"]}>
        <legend className={styles["legend"]}>SIP recovery</legend>
        <label className={styles["toggle"]} htmlFor="settings-sip-auto-reregister">
          <input
            id="settings-sip-auto-reregister"
            type="checkbox"
            className={styles["checkbox"]}
            data-testid="settings-sip-auto-reregister-toggle"
            checked={sipAutoReregisterEnabled}
            onChange={handleSipAutoReregisterChange}
          />
          <span className={styles["toggleLabel"]}>Automatic SIP re-registration</span>
        </label>
        <label className={styles["field"]} htmlFor="settings-sip-reregister-interval">
          <span className={styles["fieldLabel"]}>Retry interval (seconds)</span>
          <input
            id="settings-sip-reregister-interval"
            type="number"
            min={MIN_SIP_REREGISTER_INTERVAL_SEC}
            step={1}
            className={styles["numberInput"]}
            data-testid="settings-sip-reregister-interval"
            value={sipReregisterIntervalSec}
            onChange={handleIntervalChange}
          />
        </label>
        <p className={styles["hint"]} data-testid="settings-sip-recovery-hint">
          Flat retry delay for SIP transport reconnect and registration failures (minimum{" "}
          {MIN_SIP_REREGISTER_INTERVAL_SEC}s).
        </p>
      </fieldset>
    </form>
  );
}
