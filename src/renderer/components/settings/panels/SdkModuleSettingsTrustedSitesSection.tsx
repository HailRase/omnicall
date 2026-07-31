import type { ChangeEvent, JSX } from "react";
import { useEffect, useState } from "react";
import type {
  SdkIntegrationSettings,
  SdkOriginCapabilityMatrix,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Accordion, Button, Input } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";
import { SdkModuleSettingsTrustedSiteItem } from "./SdkModuleSettingsTrustedSiteItem.js";

type Props = Readonly<{
  settings: SdkIntegrationSettings;
  addOriginDraft: string;
  busy: boolean;
  onAddOrigin: (draft?: string) => void;
  onBlacklistOrigin: (origin: string) => void;
  onRemoveAllowedOrigin: (origin: string) => void;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
}>;

/** Trusted sites: add form + accordion CRUD / permissions. */
export function SdkModuleSettingsTrustedSitesSection(props: Props): JSX.Element {
  const { t } = useI18n();
  const {
    settings,
    addOriginDraft,
    busy,
    onAddOrigin,
    onBlacklistOrigin,
    onRemoveAllowedOrigin,
    onRenameAllowedOrigin,
    onSetOriginMatrix,
  } = props;

  const allowedEntries = settings.origins.filter((entry) => entry.state === "allowed");
  const [localDraft, setLocalDraft] = useState(addOriginDraft);

  useEffect(() => {
    setLocalDraft(addOriginDraft);
  }, [addOriginDraft]);

  function handleAddDraftChange(event: ChangeEvent<HTMLInputElement>): void {
    setLocalDraft(event.target.value);
  }

  function handleAdd(): void {
    onAddOrigin(localDraft);
  }

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-allowed-origins">
      <p className={formStyles.blockHint}>
        {settings.originsManaged
          ? t("settings.integrations.sdk.origins.managedHint")
          : t("settings.integrations.sdk.origins.envHint")}
      </p>

      <div className={styles.addSiteBlock}>
        <label className={formStyles.fieldLabel} htmlFor="sdk-module-origin-add">
          {t("settings.integrations.sdk.origins.add")}
        </label>
        <div className={styles.addSiteRow}>
          <Input
            id="sdk-module-origin-add"
            className={styles.addSiteInput}
            size="sm"
            value={localDraft}
            disabled={busy}
            placeholder={t("settings.integrations.sdk.origins.placeholder")}
            data-testid="sdk-module-origin-add-input"
            onChange={handleAddDraftChange}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || localDraft.trim().length === 0}
            data-testid="sdk-module-origin-add"
            onClick={handleAdd}
          >
            {t("settings.integrations.sdk.origins.addAction")}
          </Button>
        </div>
      </div>

      {allowedEntries.length === 0 ? (
        <p className={formStyles.blockHint} data-testid="sdk-module-origins-empty">
          {t("settings.integrations.sdk.origins.empty")}
        </p>
      ) : (
        <>
          <hr className={styles.addSiteSeparator} />
          <Accordion
            type="single"
            collapsible
            className={styles.trustedAccordion}
            data-testid="sdk-module-trusted-accordion"
          >
            {allowedEntries.map((entry) => (
              <SdkModuleSettingsTrustedSiteItem
                key={entry.origin}
                entry={entry}
                busy={busy}
                onBlacklistOrigin={onBlacklistOrigin}
                onRemoveAllowedOrigin={onRemoveAllowedOrigin}
                onRenameAllowedOrigin={onRenameAllowedOrigin}
                onSetOriginMatrix={onSetOriginMatrix}
              />
            ))}
          </Accordion>
        </>
      )}
    </div>
  );
}
