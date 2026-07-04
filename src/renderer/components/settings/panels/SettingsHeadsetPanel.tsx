import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render headset section placeholder until P10 headset UI ships.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned headset integration.
 */
export function SettingsHeadsetPanel(): JSX.Element {
  const { t } = useI18n();
  return (
    <SettingsPlaceholderPanel
      title={t("settings.headset.title")}
      testId="settings-headset-panel"
      description={t("settings.headset.description")}
    />
  );
}
