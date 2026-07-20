import clsx from "clsx";
import type { JSX } from "react";
import type {
  SdkActivateGrantResultProjection,
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkProfileOption } from "../../../hooks/useSdkSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";
import { SdkModuleSettingsGrantSection } from "./SdkModuleSettingsGrantSection.js";
import { SdkModuleSettingsPairedSection } from "./SdkModuleSettingsPairedSection.js";

type Props = Readonly<{
  diagnostics: SdkGatewayDiagnosticsProjection;
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  profileOptions: readonly SdkProfileOption[];
  selectedClientId: string | null;
  selectedProfileId: string | null;
  lastGrant: SdkActivateGrantResultProjection | null;
  busy: boolean;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
  onRevokeClient: (clientId: string) => void;
  onSelectClientId: (clientId: string | null) => void;
  onSelectProfileId: (profileId: string | null) => void;
  onIssueActivateGrant: () => void;
}>;

/** Diagnostics, hide-disabled, clients, and activate-grant UX. */
export function SdkModuleSettingsClientsSection(props: Props): JSX.Element {
  const { t } = useI18n();
  const { diagnostics } = props;

  return (
    <>
      <div className={formStyles.settingBlock} data-testid="sdk-module-diagnostics">
        <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.status")}</p>
        <div className={styles.diagnosticsGrid}>
          <span className={styles.diagnosticsLabel}>
            {t("settings.integrations.sdk.status.state")}
          </span>
          <span className={styles.diagnosticsValue}>
            {diagnostics.status === "listening"
              ? t("settings.integrations.sdk.status.listening")
              : t("settings.integrations.sdk.status.disabled")}
          </span>
          <span className={styles.diagnosticsLabel}>
            {t("settings.integrations.sdk.status.connections")}
          </span>
          <span className={styles.diagnosticsValue}>{diagnostics.connectionCount}</span>
          <span className={styles.diagnosticsLabel}>
            {t("settings.integrations.sdk.status.authenticated")}
          </span>
          <span className={styles.diagnosticsValue}>{diagnostics.authenticatedCount}</span>
          <span className={styles.diagnosticsLabel}>
            {t("settings.integrations.sdk.status.lastError")}
          </span>
          <span className={styles.diagnosticsValue}>
            {diagnostics.lastErrorCode ?? t("settings.integrations.sdk.status.noError")}
          </span>
        </div>
      </div>

      <div
        className={clsx(formStyles.settingBlock, formStyles.settingBlockDisabled)}
        data-testid="sdk-module-hide-disabled"
      >
        <label className={formStyles.toggleRow} htmlFor="sdk-module-hide">
          <span className={formStyles.toggleText}>
            <span className={formStyles.toggleLabel}>
              {t("settings.integrations.sdk.hide")}
            </span>
            <span className={formStyles.toggleDescription}>
              {t("settings.integrations.sdk.hide.disabledReason")}
            </span>
          </span>
          <Switch
            id="sdk-module-hide"
            checked={false}
            disabled
            data-testid="sdk-module-hide-toggle"
            onCheckedChange={() => undefined}
          />
        </label>
      </div>

      <SdkModuleSettingsPairedSection
        pairedClients={props.pairedClients}
        pendingPairing={props.pendingPairing}
        busy={props.busy}
        onApprovePairing={props.onApprovePairing}
        onDenyPairing={props.onDenyPairing}
        onRevokeClient={props.onRevokeClient}
      />
      <SdkModuleSettingsGrantSection
        pairedClients={props.pairedClients}
        profileOptions={props.profileOptions}
        selectedClientId={props.selectedClientId}
        selectedProfileId={props.selectedProfileId}
        lastGrant={props.lastGrant}
        busy={props.busy}
        onSelectClientId={props.onSelectClientId}
        onSelectProfileId={props.onSelectProfileId}
        onIssueActivateGrant={props.onIssueActivateGrant}
      />
    </>
  );
}
