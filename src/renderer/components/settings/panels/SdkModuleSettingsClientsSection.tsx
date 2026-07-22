import type { JSX } from "react";
import type { SdkPairedClientProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import { Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import { SdkModuleSettingsPairedSection } from "./SdkModuleSettingsPairedSection.js";
import clsx from "clsx";

type Props = Readonly<{
  pairedClients: readonly SdkPairedClientProjection[];
  busy: boolean;
  onRevokeClient: (clientId: string) => void;
}>;

/** Paired clients + single advanced “hide unavailable” note (no temporary grant). */
export function SdkModuleSettingsClientsSection(props: Props): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      <SdkModuleSettingsPairedSection
        pairedClients={props.pairedClients}
        busy={props.busy}
        onRevokeClient={props.onRevokeClient}
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
