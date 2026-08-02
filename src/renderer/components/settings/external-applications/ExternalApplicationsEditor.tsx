/**
 * - Purpose: edit one External Application configuration draft.
 * - Inputs: selected draft, busy state, rename force key, action callbacks.
 * - Outputs: validated UI intents without facade or Electron access.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/index.js";
import { ExternalServicesTriggerList } from "../external-services/ExternalServicesTriggerList.js";
import { ExternalServicesTemplateField } from "../external-services/templateAutocomplete/ExternalServicesTemplateField.js";
import { ExternalApplicationsConditionsSection } from "./ExternalApplicationsConditionsSection.js";
import { ExternalApplicationsGeneralTab } from "./ExternalApplicationsGeneralTab.js";
import { ExternalApplicationsInlineRename } from "./ExternalApplicationsInlineRename.js";
import { ExternalApplicationsVariablesTab } from "./ExternalApplicationsVariablesTab.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsEditorProps = Readonly<{
  application: ExternalApplicationsPanelApplication;
  busy: boolean;
  saveError: boolean;
  forceNameEditKey: number;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
  onSave: () => void;
  onOpenNow: () => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsEditor({
  application,
  busy,
  saveError,
  forceNameEditKey,
  onChange,
  onSave,
  onOpenNow,
}: ExternalApplicationsEditorProps): JSX.Element {
  const { t } = useI18n();
  const collectionVariableKeys = application.variables.map((variable) => variable.key);
  const canOpen = application.urlTemplate.trim().length > 0;
  const openDisabledReason = canOpen
    ? null
    : t("settings.integrations.externalApplications.disabled.urlRequired");

  return (
    <div className={styles.editor} data-testid="external-applications-editor">
      <div className={styles.editorTopBar}>
        <ExternalApplicationsInlineRename
          value={application.name}
          disabled={busy}
          ariaLabel={t("settings.integrations.externalApplications.name")}
          testId="external-applications-name"
          forceEditKey={forceNameEditKey}
          onCommit={(name) => {
            onChange({ ...application, name });
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          data-testid="external-applications-save"
          onClick={onSave}
        >
          {t("settings.integrations.externalApplications.save")}
        </Button>
      </div>

      {saveError ? (
        <p className={styles.error} role="alert">
          {t("settings.integrations.externalApplications.validation.saveFailed")}
        </p>
      ) : null}

      <div className={styles.urlBarBlock}>
        <div className={styles.urlBar}>
          <ExternalServicesTemplateField
            variant="input"
            value={application.urlTemplate}
            disabled={busy}
            collectionVariableKeys={collectionVariableKeys}
            aria-label={t("settings.integrations.externalApplications.url")}
            data-testid="external-applications-url"
            placeholder={t("settings.integrations.externalApplications.urlPlaceholder")}
            onValueChange={(urlTemplate) => {
              onChange({ ...application, urlTemplate });
            }}
          />
          <IconTooltip
            label={openDisabledReason ?? t("settings.integrations.externalApplications.openNow")}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canOpen || busy}
              aria-label={t("settings.integrations.externalApplications.openNow")}
              className={styles.openButton}
              data-testid="external-applications-open-now"
              onClick={onOpenNow}
            >
              <AppIcon
                id="settings.integrations.external-applications.open"
                size={14}
                decorative
              />
            </Button>
          </IconTooltip>
        </div>
      </div>

      <div className={styles.editorTabsPane}>
        <Tabs defaultValue="general" className={styles.editorTabsRoot}>
          <TabsList className={styles.editorTabsList}>
            <TabsTrigger value="general" data-testid="external-applications-tab-general">
              {t("settings.integrations.externalApplications.tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="external-applications-tab-events">
              {t("settings.integrations.externalApplications.tabs.events")}
            </TabsTrigger>
            <TabsTrigger
              value="conditions"
              data-testid="external-applications-tab-conditions"
            >
              {t("settings.integrations.externalApplications.tabs.conditions")}
            </TabsTrigger>
            <TabsTrigger value="variables" data-testid="external-applications-tab-variables">
              {t("settings.integrations.externalApplications.tabs.variables")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className={styles.editorTabBody}>
            <ExternalApplicationsGeneralTab
              application={application}
              busy={busy}
              onChange={onChange}
            />
          </TabsContent>

          <TabsContent value="events" className={styles.editorTabBody}>
            <ExternalServicesTriggerList
              triggers={application.triggers}
              disabled={busy}
              onChange={(triggers) => {
                onChange({ ...application, triggers });
              }}
            />
          </TabsContent>

          <TabsContent value="conditions" className={styles.editorTabBody}>
            <ExternalApplicationsConditionsSection
              application={application}
              busy={busy}
              onChange={onChange}
            />
          </TabsContent>

          <TabsContent value="variables" className={styles.editorTabBody}>
            <ExternalApplicationsVariablesTab
              application={application}
              busy={busy}
              onChange={onChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
