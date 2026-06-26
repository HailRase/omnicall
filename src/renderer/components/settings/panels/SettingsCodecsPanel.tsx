import type { JSX } from "react";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render codecs section placeholder until media settings ship.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned codec preferences.
 */
export function SettingsCodecsPanel(): JSX.Element {
  return (
    <SettingsPlaceholderPanel
      title="Кодеки"
      testId="settings-codecs-panel"
      description="Выбор и приоритет аудиокодеков будет доступен после интеграции медиа-настроек."
    />
  );
}
