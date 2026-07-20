import type { JSX } from "react";
import type {
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  busy: boolean;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
  onRevokeClient: (clientId: string) => void;
}>;

/** Pending pairing approvals and paired-client revoke list. */
export function SdkModuleSettingsPairedSection({
  pairedClients,
  pendingPairing,
  busy,
  onApprovePairing,
  onDenyPairing,
  onRevokeClient,
}: Props): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      {pendingPairing.length > 0 ? (
        <div className={formStyles.settingBlock} data-testid="sdk-module-pending">
          <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.pending.title")}</p>
          <ul className={styles.list}>
            {pendingPairing.map((pending) => (
              <li key={pending.pairingRequestId} className={styles.listItem}>
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>{pending.applicationName}</span>
                  <span className={styles.listSubtitle}>{pending.origin}</span>
                </div>
                <div className={styles.actionsRow}>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    data-testid={`sdk-module-approve-${pending.pairingRequestId}`}
                    onClick={() => {
                      onApprovePairing(pending.pairingRequestId);
                    }}
                  >
                    {t("settings.integrations.sdk.pending.approve")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      onDenyPairing(pending.pairingRequestId);
                    }}
                  >
                    {t("settings.integrations.sdk.pending.deny")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={formStyles.settingBlock} data-testid="sdk-module-paired">
        <p className={formStyles.fieldLabel}>
          {t("settings.integrations.sdk.paired.title")}
        </p>
        {pairedClients.length === 0 ? (
          <p className={formStyles.blockHint}>{t("settings.integrations.sdk.paired.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {pairedClients.map((client) => (
              <li key={client.clientId} className={styles.listItem}>
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>{client.applicationName}</span>
                  <span className={styles.listSubtitle}>
                    {client.origin}
                    {client.revoked
                      ? ` · ${t("settings.integrations.sdk.paired.revoked")}`
                      : ""}
                  </span>
                </div>
                {!client.revoked ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        data-testid={`sdk-module-revoke-${client.clientId}`}
                      >
                        {t("settings.integrations.sdk.paired.revoke")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("settings.integrations.sdk.paired.revokeTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("settings.integrations.sdk.paired.revokeMessage")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("settings.integrations.sdk.paired.revokeCancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-testid={`sdk-module-revoke-confirm-${client.clientId}`}
                          onClick={() => {
                            onRevokeClient(client.clientId);
                          }}
                        >
                          {t("settings.integrations.sdk.paired.revokeConfirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
