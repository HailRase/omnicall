import clsx from "clsx";
import type { JSX } from "react";
import type {
  SdkActivateGrantResultProjection,
  SdkPairedClientProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkProfileOption } from "../../../hooks/useSdkSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import { SdkModuleSettingsGrantSection } from "./SdkModuleSettingsGrantSection.js";
import { SdkModuleSettingsPairedSection } from "./SdkModuleSettingsPairedSection.js";

type Props = Readonly<{
  pairedClients: readonly SdkPairedClientProjection[];
  profileOptions: readonly SdkProfileOption[];
  selectedClientId: string | null;
  selectedProfileId: string | null;
  lastGrant: SdkActivateGrantResultProjection | null;
  busy: boolean;
  onRevokeClient: (clientId: string) => void;
  onSelectClientId: (clientId: string | null) => void;
  onSelectProfileId: (profileId: string | null) => void;
  onIssueActivateGrant: () => void;
}>;

/** Clients & access + single advanced “hide unavailable” note. */
export function SdkModuleSettingsClientsSection(props: Props): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      <SdkModuleSettingsPairedSection
        pairedClients={props.pairedClients}
        busy={props.busy}
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
    </>
  );
}
