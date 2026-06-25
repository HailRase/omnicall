import type { ChangeEvent, JSX } from "react";

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
    <form className="settings-overlay" data-testid="settings-overlay-body">
      {updateError !== null && (
        <p className="settings-overlay__error" role="alert" data-testid="settings-update-error">
          {updateError}
        </p>
      )}
      <fieldset className="settings-overlay__fieldset">
        <legend className="settings-overlay__legend">Call sessions</legend>
        <label className="settings-overlay__toggle" htmlFor="settings-multi-sessions">
          <input
            id="settings-multi-sessions"
            type="checkbox"
            className="settings-overlay__checkbox"
            data-testid="settings-multi-sessions-toggle"
            checked={multiSessionsEnabled}
            onChange={handleMultiSessionsChange}
          />
          <span className="settings-overlay__toggle-label">Allow multiple call sessions</span>
        </label>
        <p className="settings-overlay__hint" data-testid="settings-multi-sessions-hint">
          When disabled, a second incoming or outgoing call is blocked while a call is active.
        </p>
      </fieldset>
    </form>
  );
}
