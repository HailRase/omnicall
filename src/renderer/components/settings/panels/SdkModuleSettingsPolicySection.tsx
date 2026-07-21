import type { ChangeEvent, JSX } from "react";
import {
  withMatrixCapability,
  type SdkIntegrationSettings,
  type SdkOriginCapabilityMatrix,
} from "@application/index.js";
import type { SdkGatewayDiagnosticsProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  pendingOriginTrust: readonly { originTrustRequestId: string; origin: string }[];
  originsDraft: string;
  busy: boolean;
  onOriginsDraftChange: (value: string) => void;
  onOriginsSave: () => void;
  onRefresh: () => void;
  onAllowOriginTrust: (requestId: string) => void;
  onDenyOriginTrust: (requestId: string) => void;
  onUnblockOrigin: (origin: string) => void;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
}>;

/** Policy / bind / origins controls for SDK Server card. */
export function SdkModuleSettingsPolicySection(props: Props): JSX.Element {
  const { t } = useI18n();
  const {
    settings,
    diagnostics,
    allowedOriginsLive,
    pendingOriginTrust,
    originsDraft,
    busy,
    onOriginsDraftChange,
    onOriginsSave,
    onRefresh,
    onAllowOriginTrust,
    onDenyOriginTrust,
    onUnblockOrigin,
    onSetOriginMatrix,
  } = props;

  function handleOriginsChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onOriginsDraftChange(event.target.value);
  }

  return (
    <>
      <div className={formStyles.settingBlock}>
        <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.bind")}</p>
        <p className={formStyles.fieldValue} data-testid="sdk-module-bind">
          {diagnostics.bindHost ?? t("settings.integrations.sdk.bind.loopback")}
          {diagnostics.bindPort !== null ? `:${String(diagnostics.bindPort)}` : ""}
        </p>
        <p className={formStyles.blockHint}>{t("settings.integrations.sdk.bind.hint")}</p>
      </div>
      {pendingOriginTrust.map((pending) => (
        <div key={pending.originTrustRequestId} className={formStyles.settingBlock}>
          <p className={formStyles.fieldLabel}>{pending.origin}</p>
          <div className={styles.actionsRow}>
            <Button size="sm" onClick={() => onAllowOriginTrust(pending.originTrustRequestId)}>
              {t("settings.integrations.sdk.tofu.allow")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDenyOriginTrust(pending.originTrustRequestId)}>
              {t("settings.integrations.sdk.tofu.deny")}
            </Button>
          </div>
        </div>
      ))}
      {settings.origins.filter((entry) => entry.state === "denied").map((entry) => (
        <div key={entry.origin} className={formStyles.settingBlock}>
          <p className={formStyles.fieldValue}>{entry.origin}</p>
          <Button size="sm" onClick={() => onUnblockOrigin(entry.origin)}>
            {t("settings.integrations.sdk.blacklist.unblock")}
          </Button>
        </div>
      ))}
      {settings.origins
        .filter((entry) => entry.state === "allowed" && entry.matrix !== null)
        .map((entry) => {
          const matrix = entry.matrix;
          if (matrix === null) {
            return null;
          }
          return (
            <div key={`${entry.origin}-matrix`} className={formStyles.settingBlock}>
              <p className={formStyles.fieldValue}>{entry.origin}</p>
              <label
                className={formStyles.toggleRow}
                htmlFor={`sdk-matrix-activate-${entry.origin}`}
              >
                <span className={formStyles.toggleLabel}>
                  {t("settings.integrations.sdk.matrix.activate")}
                </span>
                <Switch
                  id={`sdk-matrix-activate-${entry.origin}`}
                  checked={matrix.capabilities["account.activate"] === true}
                  disabled={busy}
                  data-testid={`sdk-matrix-activate-${entry.origin}`}
                  onCheckedChange={(checked) => {
                    onSetOriginMatrix(
                      entry.origin,
                      withMatrixCapability(matrix, "account.activate", checked),
                    );
                  }}
                />
              </label>
            </div>
          );
        })}

      <div className={formStyles.settingBlock}>
        <label className={formStyles.fieldLabel} htmlFor="sdk-module-origins">
          {t("settings.integrations.sdk.origins")}
        </label>
        <textarea
          id="sdk-module-origins"
          className={styles.originsTextarea}
          value={originsDraft}
          disabled={busy}
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
            disabled={busy}
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
