import type { ChangeEvent, JSX } from "react";
import formStyles from "../SettingsForm.module.css";

export type SettingsSessionsPanelProps = Readonly<{
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
}>;

/**
 * - Purpose: present multi-call session settings in the Sessions section.
 * - Inputs: multi-sessions flag and change callback.
 * - Outputs: accessible toggle without facade access.
 */
export function SettingsSessionsPanel({
  multiSessionsEnabled,
  onMultiSessionsChange,
}: SettingsSessionsPanelProps): JSX.Element {
  const handleMultiSessionsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onMultiSessionsChange(event.target.checked);
  };

  return (
    <fieldset className={formStyles["fieldset"]} data-testid="settings-sessions-panel">
      <legend className={formStyles["legend"]}>Сессии звонков</legend>
      <label className={formStyles["toggle"]} htmlFor="settings-multi-sessions">
        <input
          id="settings-multi-sessions"
          type="checkbox"
          className={formStyles["checkbox"]}
          data-testid="settings-multi-sessions-toggle"
          checked={multiSessionsEnabled}
          onChange={handleMultiSessionsChange}
        />
        <span className={formStyles["toggleLabel"]}>Разрешить несколько сессий звонков</span>
      </label>
      <p className={formStyles["hint"]} data-testid="settings-multi-sessions-hint">
        Если отключено, второй входящий или исходящий звонок блокируется при активном звонке.
      </p>
    </fieldset>
  );
}
