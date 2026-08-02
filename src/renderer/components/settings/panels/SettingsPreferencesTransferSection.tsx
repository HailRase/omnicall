import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsPreferencesTransferSectionProps = Readonly<{
  isBusy: boolean;
  onExport: () => void;
  onImport: () => void;
}>;

/**
 * - Purpose: present portable preferences export/import controls in General settings.
 * - Inputs: busy flag and export/import callbacks.
 * - Outputs: accessible fieldset; transfer outcomes use notifications.
 */
export function SettingsPreferencesTransferSection({
  isBusy,
  onExport,
  onImport,
}: SettingsPreferencesTransferSectionProps): JSX.Element {
  const { t } = useI18n();

  return (
    <fieldset className={formStyles.sectionCard} data-testid="settings-preferences-transfer">
      <legend className={formStyles.sectionTitle}>
        {t("settings.general.preferences.transfer.legend")}
      </legend>
      <div className={formStyles.settingsGroup}>
        <div className={formStyles.settingBlock}>
          <p className={formStyles.fieldDescription}>
            {t("settings.general.preferences.transfer.description")}
          </p>
          <p className={formStyles.fieldDescription}>
            {t("settings.general.preferences.transfer.secretsNote")}
          </p>
          <div className={formStyles.actionRow}>
            <Button
              variant="secondary"
              size="sm"
              data-testid="settings-preferences-export"
              disabled={isBusy}
              onClick={onExport}
            >
              {t("settings.general.preferences.transfer.export")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              data-testid="settings-preferences-import"
              disabled={isBusy}
              onClick={onImport}
            >
              {t("settings.general.preferences.transfer.import")}
            </Button>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
