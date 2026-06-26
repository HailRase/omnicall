import type { ChangeEvent, JSX } from "react";
import { MIN_SIP_REREGISTER_INTERVAL_SEC } from "@application/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsGeneralPanelProps = Readonly<{
  sipAutoReregisterEnabled: boolean;
  onSipAutoReregisterChange: (enabled: boolean) => void;
  sipReregisterIntervalSec: number;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
}>;

/**
 * - Purpose: present SIP re-registration settings in the General section.
 * - Inputs: SIP recovery toggles and interval with change callbacks.
 * - Outputs: accessible form fields without facade access.
 */
export function SettingsGeneralPanel({
  sipAutoReregisterEnabled,
  onSipAutoReregisterChange,
  sipReregisterIntervalSec,
  onSipReregisterIntervalChange,
}: SettingsGeneralPanelProps): JSX.Element {
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
    <fieldset className={formStyles["fieldset"]} data-testid="settings-general-panel">
      <legend className={formStyles["legend"]}>Восстановление SIP</legend>
      <label className={formStyles["toggle"]} htmlFor="settings-sip-auto-reregister">
        <input
          id="settings-sip-auto-reregister"
          type="checkbox"
          className={formStyles["checkbox"]}
          data-testid="settings-sip-auto-reregister-toggle"
          checked={sipAutoReregisterEnabled}
          onChange={handleSipAutoReregisterChange}
        />
        <span className={formStyles["toggleLabel"]}>Автоматическая перерегистрация SIP</span>
      </label>
      <label className={formStyles["field"]} htmlFor="settings-sip-reregister-interval">
        <span className={formStyles["fieldLabel"]}>Интервал повтора (секунды)</span>
        <input
          id="settings-sip-reregister-interval"
          type="number"
          min={MIN_SIP_REREGISTER_INTERVAL_SEC}
          step={1}
          className={formStyles["numberInput"]}
          data-testid="settings-sip-reregister-interval"
          value={sipReregisterIntervalSec}
          onChange={handleIntervalChange}
        />
      </label>
      <p className={formStyles["hint"]} data-testid="settings-sip-recovery-hint">
        Фиксированная задержка повтора при потере SIP-транспорта и ошибках регистрации (минимум{" "}
        {MIN_SIP_REREGISTER_INTERVAL_SEC} с).
      </p>
    </fieldset>
  );
}
