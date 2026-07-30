import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormField,
  Input,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "../../ui/index.js";
import { ExternalServicesKeyValueTable } from "./ExternalServicesKeyValueTable.js";
import type { ExternalServicesKeyValueRow } from "./ExternalServicesKeyValueTable.js";
import type { ExternalServicesJournalProps } from "./ExternalServicesJournal.js";
import { ExternalServicesResponsePane } from "./ExternalServicesResponsePane.js";
import type { ExternalServicesRunResultValue } from "./ExternalServicesRunResult.js";
import {
  ExternalServicesTriggerList,
  type ExternalServicesAutomaticEventType,
} from "./ExternalServicesTriggerList.js";
import styles from "./ExternalServices.module.css";

const bodyModeKeys: Readonly<Record<string, TranslationKey>> = {
  none: "settings.integrations.externalServices.bodyMode.none",
  json: "settings.integrations.externalServices.bodyMode.json",
  "x-www-form-urlencoded": "settings.integrations.externalServices.bodyMode.x-www-form-urlencoded",
  raw: "settings.integrations.externalServices.bodyMode.raw",
};

export type ExternalServicesRequestDraft = Readonly<{
  id: string;
  name: string;
  enabled: boolean;
  method: string;
  url: string;
  query: ReadonlyArray<ExternalServicesKeyValueRow>;
  headers: ReadonlyArray<ExternalServicesKeyValueRow>;
  body: Readonly<{ mode: string; value: string }>;
  triggers: ReadonlyArray<ExternalServicesAutomaticEventType>;
}>;

export type ExternalServicesRequestEditorProps = Readonly<{
  collectionName: string;
  draft: ExternalServicesRequestDraft;
  busy: boolean;
  errorMessage: string | null;
  runState: "idle" | "queued" | "running";
  runResult: ExternalServicesRunResultValue | null;
  journal: ExternalServicesJournalProps;
  onChange: (draft: ExternalServicesRequestDraft) => void;
  onSave: () => void;
  onRunNow: () => void;
  onDelete: () => void;
}>;

/**
 * - Purpose: Postman-like request editor with URL bar, tabs, and response pane.
 * - Inputs: draft projection, collection name, run/journal state, intent callbacks.
 * - Outputs: presentational editor intents without HTTP or mutation logic.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestEditor(props: ExternalServicesRequestEditorProps): JSX.Element {
  const { t } = useI18n();
  const { collectionName, draft, busy, errorMessage, runState, runResult, journal, onChange, onSave, onRunNow, onDelete } = props;
  const change = (patch: Partial<ExternalServicesRequestDraft>): void => onChange({ ...draft, ...patch });
  const canSend = draft.url.trim().length > 0;
  const sendDisabledReason = canSend
    ? null
    : t("settings.integrations.externalServices.disabled.urlRequired");

  return (
    <section className={styles.editorWorkspace} data-testid="external-services-request-editor">
      <header className={styles.editorTopBar}>
        <nav className={styles.breadcrumb} aria-label={t("settings.integrations.externalServices.workspace.breadcrumb")}>
          <span className={styles.breadcrumbItem}>{collectionName}</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
          <Input
            value={draft.name}
            disabled={busy}
            aria-label={t("settings.integrations.externalServices.editor.name")}
            data-testid="external-services-request-name"
            className={styles.breadcrumbNameInput}
            onChange={(event) => change({ name: event.currentTarget.value })}
          />
        </nav>
        <div className={styles.editorTopActions}>
          <Switch
            checked={draft.enabled}
            disabled={busy}
            data-testid="external-services-request-enabled"
            aria-label={t("settings.integrations.externalServices.editor.enabled")}
            onCheckedChange={(enabled) => change({ enabled })}
          />
          <Button type="button" variant="outline" size="sm" loading={busy} data-testid="external-services-save" onClick={onSave}>
            {t("settings.integrations.externalServices.actions.save")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" disabled={busy} aria-label={t("settings.integrations.externalServices.requests.menuLabel")}>
                ⋯
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem destructive disabled={busy} onSelect={onDelete}>
                {t("settings.integrations.externalServices.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {errorMessage !== null ? <p className={styles.editorError} role="alert">{errorMessage}</p> : null}

      <div className={styles.urlBar}>
        <Select
          value={draft.method}
          disabled={busy}
          data-testid="external-services-request-method"
          items={["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({ value, label: value }))}
          onValueChange={(method) => change({ method })}
        />
        <Input
          value={draft.url}
          disabled={busy}
          data-testid="external-services-request-url"
          placeholder={t("settings.integrations.externalServices.editor.urlPlaceholder")}
          onChange={(event) => change({ url: event.currentTarget.value })}
        />
        <IconTooltip
          label={sendDisabledReason ?? t("settings.integrations.externalServices.run.send")}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={runState !== "idle"}
            disabled={!canSend}
            aria-label={t("settings.integrations.externalServices.run.send")}
            className={styles.sendButton}
            data-testid="external-services-run-now"
            onClick={onRunNow}
          >
            <AppIcon
              id="settings.integrations.external-services.send"
              size={14}
              decorative
              preferAnimated={false}
            />
          </Button>
        </IconTooltip>
      </div>

      <div className={styles.editorSplit}>
        <div className={styles.editorTabsPane}>
          <Tabs defaultValue="params">
            <TabsList>
              <TabsTrigger value="params">{t("settings.integrations.externalServices.tabs.params")}</TabsTrigger>
              <TabsTrigger value="headers">
                {`${t("settings.integrations.externalServices.tabs.headers")}${draft.headers.length > 0 ? ` (${draft.headers.length})` : ""}`}
              </TabsTrigger>
              <TabsTrigger value="body">{t("settings.integrations.externalServices.tabs.body")}</TabsTrigger>
              <TabsTrigger value="triggers">{t("settings.integrations.externalServices.tabs.triggers")}</TabsTrigger>
            </TabsList>
            <TabsContent value="params" className={styles.editorTabBody}>
              <ExternalServicesKeyValueTable
                testId="external-services-query-table"
                label={t("settings.integrations.externalServices.editor.query")}
                rows={draft.query}
                disabled={busy}
                onChange={(query) => change({ query })}
              />
            </TabsContent>
            <TabsContent value="headers" className={styles.editorTabBody}>
              <ExternalServicesKeyValueTable
                testId="external-services-headers-table"
                label={t("settings.integrations.externalServices.editor.headers")}
                rows={draft.headers}
                disabled={busy}
                onChange={(headers) => change({ headers })}
              />
            </TabsContent>
            <TabsContent value="body" className={styles.editorTabBody}>
              <FormField label={t("settings.integrations.externalServices.editor.bodyMode")}>
                <Select
                  value={draft.body.mode}
                  disabled={busy}
                  data-testid="external-services-body-mode"
                  items={Object.entries(bodyModeKeys).map(([value, key]) => ({ value, label: t(key) }))}
                  onValueChange={(mode) => change({ body: { ...draft.body, mode } })}
                />
              </FormField>
              <FormField label={t("settings.integrations.externalServices.editor.body")}>
                <Textarea
                  value={draft.body.value}
                  disabled={busy}
                  data-testid="external-services-body-editor"
                  onChange={(event) => change({ body: { ...draft.body, value: event.currentTarget.value } })}
                />
              </FormField>
            </TabsContent>
            <TabsContent value="triggers" className={styles.editorTabBody}>
              <ExternalServicesTriggerList triggers={draft.triggers} disabled={busy} onChange={(triggers) => change({ triggers })} />
            </TabsContent>
          </Tabs>
        </div>
        <ExternalServicesResponsePane runState={runState} runResult={runResult} journal={journal} />
      </div>
    </section>
  );
}
