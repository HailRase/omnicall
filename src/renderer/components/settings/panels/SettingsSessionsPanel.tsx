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
    <fieldset className={formStyles["sectionCard"]} data-testid="settings-sessions-panel">
      <legend className={formStyles["sectionTitle"]}>Сессии звонков</legend>
      <div className={formStyles["settingsGroup"]}>
        <div className={formStyles["settingBlock"]}>
          <label className={formStyles["toggleRow"]} htmlFor="settings-multi-sessions">
            <span className={formStyles["toggleText"]}>
              <span className={formStyles["toggleLabel"]}>Разрешить несколько сессий звонков</span>
              <span className={formStyles["toggleDescription"]}>
                Второй звонок при активной линии
              </span>
            </span>
            <span className={formStyles["switch"]}>
              <input
                id="settings-multi-sessions"
                type="checkbox"
                className={formStyles["switchInput"]}
                data-testid="settings-multi-sessions-toggle"
                checked={multiSessionsEnabled}
                onChange={handleMultiSessionsChange}
              />
              <span className={formStyles["switchSlider"]} aria-hidden="true" />
            </span>
          </label>
          <p className={formStyles["blockHint"]} data-testid="settings-multi-sessions-hint">
            Если отключено, второй входящий или исходящий звонок блокируется при активном звонке.
          </p>
        </div>
      </div>
    </fieldset>
  );
}
