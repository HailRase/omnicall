import clsx from "clsx";
import type { JSX } from "react";
import type { SdkPairedClientProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
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
  busy: boolean;
  onRevokeClient: (clientId: string) => void;
}>;

function sortClients(
  clients: readonly SdkPairedClientProjection[],
): readonly SdkPairedClientProjection[] {
  return [...clients].sort((left, right) => {
    if (left.revoked === right.revoked) {
      return left.applicationName.localeCompare(right.applicationName);
    }
    return left.revoked ? 1 : -1;
  });
}

/** Paired clients list with revoke confirmation (active first). */
export function SdkModuleSettingsPairedSection({
  pairedClients,
  busy,
  onRevokeClient,
}: Props): JSX.Element {
  const { t } = useI18n();
  const ordered = sortClients(pairedClients);

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-paired">
      <p className={formStyles.fieldLabel}>{t("settings.integrations.sdk.paired.title")}</p>
      {ordered.length === 0 ? (
        <p className={formStyles.blockHint}>{t("settings.integrations.sdk.paired.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {ordered.map((client) => (
            <li
              key={client.clientId}
              className={clsx(styles.listItem, client.revoked && styles.listItemRevoked)}
            >
              <div className={styles.listMeta}>
                <span className={styles.listTitle}>{client.applicationName}</span>
                <span className={styles.listSubtitle} title={client.origin}>
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
                      <AlertDialogCancel asChild>
                        <Button variant="ghost">
                          {t("settings.integrations.sdk.paired.revokeCancel")}
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant="destructive"
                          data-testid={`sdk-module-revoke-confirm-${client.clientId}`}
                          onClick={() => {
                            onRevokeClient(client.clientId);
                          }}
                        >
                          {t("settings.integrations.sdk.paired.revokeConfirm")}
                        </Button>
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
  );
}
