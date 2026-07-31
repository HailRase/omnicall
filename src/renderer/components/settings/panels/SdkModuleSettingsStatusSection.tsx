import type { JSX } from "react";
import type { SdkGatewayDiagnosticsProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  diagnostics: SdkGatewayDiagnosticsProjection;
  busy: boolean;
  onRefresh: () => void;
}>;

/**
 * - Purpose: compact gateway status at top of SDK Settings (IA: status first).
 */
export function SdkModuleSettingsStatusSection({
  diagnostics,
  busy,
  onRefresh,
}: Props): JSX.Element {
  const { t } = useI18n();
  const bindHost = diagnostics.bindHost ?? t("settings.integrations.sdk.bind.loopback");
  const bindValue =
    diagnostics.bindPort !== null ? `${bindHost}:${String(diagnostics.bindPort)}` : bindHost;

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-diagnostics">
      <div className={styles.statusHeader}>
        <div className={styles.statusHeaderText}>
          <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.status")}</p>
          <p className={formStyles.fieldValue}>
            {diagnostics.status === "listening"
              ? t("settings.integrations.sdk.status.listening")
              : t("settings.integrations.sdk.status.disabled")}
          </p>
        </div>
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

      <div className={styles.diagnosticsGrid}>
        <span className={styles.diagnosticsLabel}>{t("settings.integrations.sdk.bind")}</span>
        <span className={styles.diagnosticsValue} data-testid="sdk-module-bind">
          {bindValue}
        </span>
        <span className={styles.diagnosticsLabel}>
          {t("settings.integrations.sdk.status.connections")}
        </span>
        <span className={styles.diagnosticsValue}>{diagnostics.connectionCount}</span>
        <span className={styles.diagnosticsLabel}>
          {t("settings.integrations.sdk.status.authenticated")}
        </span>
        <span className={styles.diagnosticsValue}>{diagnostics.authenticatedCount}</span>
        {diagnostics.lastErrorCode !== null ? (
          <>
            <span className={styles.diagnosticsLabel}>
              {t("settings.integrations.sdk.status.lastError")}
            </span>
            <span className={styles.diagnosticsValue}>{diagnostics.lastErrorCode}</span>
          </>
        ) : null}
      </div>
      <p className={formStyles.blockHint}>{t("settings.integrations.sdk.bind.hint")}</p>
    </div>
  );
}
