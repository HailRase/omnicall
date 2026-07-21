import type { JSX } from "react";
import type { SdkOriginTrustEntry } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  entries: readonly SdkOriginTrustEntry[];
  busy: boolean;
  onUnblockOrigin: (origin: string) => void;
}>;

/** Blocked sites: origin left, Unblock action aligned to the row end. */
export function SdkModuleSettingsBlockedSitesSection({
  entries,
  busy,
  onUnblockOrigin,
}: Props): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-blacklist">
      {entries.length === 0 ? (
        <p className={formStyles.blockHint} data-testid="sdk-module-blacklist-empty">
          {t("settings.integrations.sdk.blacklist.empty")}
        </p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.origin} className={styles.blockedRow}>
              <span className={styles.listTitle} title={entry.origin}>
                {entry.origin}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                data-testid={`sdk-origin-unblock-${entry.origin}`}
                onClick={() => {
                  onUnblockOrigin(entry.origin);
                }}
              >
                {t("settings.integrations.sdk.blacklist.unblock")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
