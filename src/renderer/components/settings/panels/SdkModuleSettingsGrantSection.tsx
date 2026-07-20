import type { JSX } from "react";
import type {
  SdkActivateGrantResultProjection,
  SdkPairedClientProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkProfileOption } from "../../../hooks/useSdkSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, Select } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  pairedClients: readonly SdkPairedClientProjection[];
  profileOptions: readonly SdkProfileOption[];
  selectedClientId: string | null;
  selectedProfileId: string | null;
  lastGrant: SdkActivateGrantResultProjection | null;
  busy: boolean;
  onSelectClientId: (clientId: string | null) => void;
  onSelectProfileId: (profileId: string | null) => void;
  onIssueActivateGrant: () => void;
}>;

/** Desktop-owned short-lived activate grant issuance (opaque profileRef only). */
export function SdkModuleSettingsGrantSection(props: Props): JSX.Element {
  const { t } = useI18n();
  const {
    pairedClients,
    profileOptions,
    selectedClientId,
    selectedProfileId,
    lastGrant,
    busy,
    onSelectClientId,
    onSelectProfileId,
    onIssueActivateGrant,
  } = props;

  const clientItems = pairedClients
    .filter((client) => !client.revoked)
    .map((client) => ({
      value: client.clientId,
      label: `${client.applicationName} · ${client.origin}`,
    }));

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-activate-grant">
      <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.grant.title")}</p>
      <p className={formStyles.blockHint}>{t("settings.integrations.sdk.grant.hint")}</p>
      <div className={styles.actionsRow}>
        <Select
          aria-label={t("settings.integrations.sdk.grant.client")}
          {...(selectedClientId !== null ? { value: selectedClientId } : {})}
          disabled={busy || clientItems.length === 0}
          items={clientItems}
          size="sm"
          placeholder={t("settings.integrations.sdk.grant.clientPlaceholder")}
          data-testid="sdk-module-grant-client"
          onValueChange={(value) => {
            onSelectClientId(value);
          }}
        />
        <Select
          aria-label={t("settings.integrations.sdk.grant.profile")}
          {...(selectedProfileId !== null ? { value: selectedProfileId } : {})}
          disabled={busy || profileOptions.length === 0}
          items={profileOptions.map((profile) => ({
            value: profile.id,
            label: profile.label,
          }))}
          size="sm"
          placeholder={t("settings.integrations.sdk.grant.profilePlaceholder")}
          data-testid="sdk-module-grant-profile"
          onValueChange={(value) => {
            onSelectProfileId(value);
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={busy || selectedClientId === null || selectedProfileId === null}
          data-testid="sdk-module-grant-issue"
          onClick={onIssueActivateGrant}
        >
          {t("settings.integrations.sdk.grant.issue")}
        </Button>
      </div>
      {lastGrant?.ok === true ? (
        <p className={styles.grantResult} data-testid="sdk-module-grant-ref">
          {t("settings.integrations.sdk.grant.result", {
            profileRef: lastGrant.profileRef,
          })}
        </p>
      ) : null}
      {lastGrant?.ok === false ? (
        <p className={formStyles.error} role="alert">
          {t("settings.integrations.sdk.grant.failed")}
        </p>
      ) : null}
    </div>
  );
}
