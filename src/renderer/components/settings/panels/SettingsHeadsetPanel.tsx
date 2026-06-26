import type { JSX } from "react";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render headset section placeholder until P10 headset UI ships.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned headset integration.
 */
export function SettingsHeadsetPanel(): JSX.Element {
  return (
    <SettingsPlaceholderPanel
      title="Гарнитура"
      testId="settings-headset-panel"
      description="Настройка гарнитуры и кнопок наушников появится в фазе P10 — интеграция гарнитур."
    />
  );
}
