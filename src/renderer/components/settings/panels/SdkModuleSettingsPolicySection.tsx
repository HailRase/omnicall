import type { ChangeEvent, JSX } from "react";
import type { SdkIntegrationSettings } from "@application/index.js";
import type { SdkGatewayDiagnosticsProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  originsDraft: string;
  busy: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onOriginsDraftChange: (value: string) => void;
  onOriginsSave: () => void;
  onRefresh: () => void;
}>;

/** Policy / bind / origins controls for SDK Server card. */
export function SdkModuleSettingsPolicySection(props: Props): JSX.Element {
  const { t } = useI18n();
  const {
    settings,
    diagnostics,
    allowedOriginsLive,
    originsDraft,
    busy,
    onEnabledChange,
    onOriginsDraftChange,
    onOriginsSave,
    onRefresh,
  } = props;

  function handleOriginsChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onOriginsDraftChange(event.target.value);
  }

  return (
    <>
      <div className={formStyles.settingBlock}>
        <label className={formStyles.toggleRow} htmlFor="sdk-module-enabled">
          <span className={formStyles.toggleText}>
            <span className={formStyles.toggleLabel}>
              {t("settings.integrations.sdk.enabled")}
            </span>
            <span className={formStyles.toggleDescription}>
              {t("settings.integrations.sdk.enabled.hint")}
            </span>
          </span>
          <Switch
            id="sdk-module-enabled"
            checked={settings.enabled}
            disabled={busy}
            data-testid="sdk-module-enabled-toggle"
            onCheckedChange={onEnabledChange}
          />
        </label>
      </div>

      <div className={formStyles.settingBlock}>
        <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.bind")}</p>
        <p className={formStyles.fieldValue} data-testid="sdk-module-bind">
          {diagnostics.bindHost ?? t("settings.integrations.sdk.bind.loopback")}
          {diagnostics.bindPort !== null ? `:${String(diagnostics.bindPort)}` : ""}
        </p>
        <p className={formStyles.blockHint}>{t("settings.integrations.sdk.bind.hint")}</p>
      </div>

      <div className={formStyles.settingBlock}>
        <label className={formStyles.fieldLabel} htmlFor="sdk-module-origins">
          {t("settings.integrations.sdk.origins")}
        </label>
        <textarea
          id="sdk-module-origins"
          className={styles.originsTextarea}
          value={originsDraft}
          disabled={busy || !settings.enabled}
          placeholder={t("settings.integrations.sdk.origins.placeholder")}
          data-testid="sdk-module-origins-input"
          onChange={handleOriginsChange}
        />
        <p className={formStyles.blockHint}>
          {settings.originsManaged
            ? t("settings.integrations.sdk.origins.managedHint")
            : t("settings.integrations.sdk.origins.envHint")}
        </p>
        <div className={styles.actionsRow}>
          <Button
            type="button"
            size="sm"
            disabled={busy || !settings.enabled}
            data-testid="sdk-module-origins-save"
            onClick={onOriginsSave}
          >
            {t("settings.integrations.sdk.origins.save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            data-testid="sdk-module-refresh"
            onClick={onRefresh}
          >
            {t("settings.integrations.sdk.refresh")}
          </Button>
        </div>
        {allowedOriginsLive.length > 0 ? (
          <p className={formStyles.fieldValue} data-testid="sdk-module-origins-live">
            {t("settings.integrations.sdk.origins.live", {
              origins: allowedOriginsLive.join(", "),
            })}
          </p>
        ) : (
          <p className={formStyles.blockHint} data-testid="sdk-module-origins-empty">
            {t("settings.integrations.sdk.origins.empty")}
          </p>
        )}
      </div>
    </>
  );
}
