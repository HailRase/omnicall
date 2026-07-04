import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { SettingsPlaceholderPanel } from "./SettingsPlaceholderPanel.js";

/**
 * - Purpose: render codecs section placeholder until media settings ship.
 * - Inputs: none.
 * - Outputs: Russian placeholder copy for planned codec preferences.
 */
export function SettingsCodecsPanel(): JSX.Element {
  const { t } = useI18n();
  return (
    <SettingsPlaceholderPanel
      title={t("settings.codecs.title")}
      testId="settings-codecs-panel"
      description={t("settings.codecs.description")}
    />
  );
}
