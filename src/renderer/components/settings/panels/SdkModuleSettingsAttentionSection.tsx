import type { JSX } from "react";
import type { SdkPendingPairingProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import styles from "./SdkModuleSettingsCard.module.css";

type PendingOriginTrust = Readonly<{
  originTrustRequestId: string;
  origin: string;
}>;

type Props = Readonly<{
  pendingOriginTrust: readonly PendingOriginTrust[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  busy: boolean;
  onAllowOriginTrust: (requestId: string) => void;
  onDenyOriginTrust: (requestId: string) => void;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
}>;

/**
 * - Purpose: urgent TOFU / pairing callouts above policy lists.
 */
export function SdkModuleSettingsAttentionSection(props: Props): JSX.Element | null {
  const { t } = useI18n();
  const {
    pendingOriginTrust,
    pendingPairing,
    busy,
    onAllowOriginTrust,
    onDenyOriginTrust,
    onApprovePairing,
    onDenyPairing,
  } = props;

  if (pendingOriginTrust.length === 0 && pendingPairing.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionStack} data-testid="sdk-module-attention">
      {pendingOriginTrust.map((pending) => (
        <div
          key={pending.originTrustRequestId}
          className={styles.callout}
          data-testid={`sdk-module-tofu-${pending.originTrustRequestId}`}
        >
          <p className={styles.calloutTitle}>{t("settings.integrations.sdk.tofu.title")}</p>
          <p className={styles.calloutBody} title={pending.origin}>
            {t("settings.integrations.sdk.tofu.message", { origin: pending.origin })}
          </p>
          <div className={styles.actionsRow}>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                onAllowOriginTrust(pending.originTrustRequestId);
              }}
            >
              {t("settings.integrations.sdk.tofu.allow")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                onDenyOriginTrust(pending.originTrustRequestId);
              }}
            >
              {t("settings.integrations.sdk.tofu.deny")}
            </Button>
          </div>
        </div>
      ))}

      {pendingPairing.length > 0 ? (
        <div className={styles.callout} data-testid="sdk-module-pending">
          <p className={styles.calloutTitle}>{t("settings.integrations.sdk.pending.title")}</p>
          <ul className={styles.list}>
            {pendingPairing.map((pending) => (
              <li key={pending.pairingRequestId} className={styles.listItem}>
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>{pending.applicationName}</span>
                  <span className={styles.listSubtitle} title={pending.origin}>
                    {pending.origin}
                  </span>
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
    </div>
  );
}
