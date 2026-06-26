import type { JSX } from "react";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render diagnostics section placeholder until F-017 panel ships.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned diagnostics UI.
 */
export function SettingsDiagnosticsPanel(): JSX.Element {
  return (
    <SettingsPlaceholderPanel
      title="Диагностика"
      testId="settings-diagnostics-panel"
      description="Журналы, SIP- и аудиодиагностика и экспорт появятся в следующих версиях. Пока используйте системные логи приложения."
    />
  );
}
