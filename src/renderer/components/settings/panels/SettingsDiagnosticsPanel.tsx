import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render diagnostics section placeholder until F-017 panel ships.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned diagnostics UI.
 */
export function SettingsDiagnosticsPanel(): JSX.Element {
  const { t } = useI18n();
  return (
    <SettingsPlaceholderPanel
      title={t("settings.diagnostics.title")}
      testId="settings-diagnostics-panel"
      description={t("settings.diagnostics.description")}
    />
  );
}
