import { useRef, useState, type JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormField,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui/index.js";
import { ExternalServicesBodyModeRadios } from "./ExternalServicesBodyModeRadios.js";
import { ExternalServicesInlineRename } from "./ExternalServicesInlineRename.js";
import { ExternalServicesKeyValueTable } from "./ExternalServicesKeyValueTable.js";
import type { ExternalServicesKeyValueRow } from "./ExternalServicesKeyValueTable.js";
import type { ExternalServicesJournalProps } from "./ExternalServicesJournal.js";
import type { ExternalServicesQueueProps } from "./ExternalServicesQueue.js";
import { ExternalServicesRequestUrlBar } from "./ExternalServicesRequestUrlBar.js";
import { ExternalServicesResponsePane } from "./ExternalServicesResponsePane.js";
import type { ExternalServicesRunResultValue } from "./ExternalServicesRunResult.js";
import {
  ExternalServicesSystemVariablesHelp,
  type ExternalServicesVariableInsertTarget,
} from "./ExternalServicesSystemVariablesHelp.js";
import {
  ExternalServicesTriggerList,
  type ExternalServicesAutomaticEventType,
} from "./ExternalServicesTriggerList.js";
import { ExternalServicesTemplateField } from "./templateAutocomplete/ExternalServicesTemplateField.js";
import { insertTemplateTokenAtCaret } from "./templateAutocomplete/insertTemplateTokenAtCaret.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRequestDraft = Readonly<{
  id: string;
  name: string;
  enabled: boolean;
  method: string;
  url: string;
  query: ReadonlyArray<ExternalServicesKeyValueRow>;
  headers: ReadonlyArray<ExternalServicesKeyValueRow>;
  body: Readonly<{ mode: string; value: string }>;
  triggers: ReadonlyArray<Readonly<{
    eventType: ExternalServicesAutomaticEventType;
    delaySeconds: number;
  }>>;
}>;

export type ExternalServicesRequestEditorProps = Readonly<{
  collectionName: string;
  collectionVariableKeys: ReadonlyArray<string>;
  draft: ExternalServicesRequestDraft;
  busy: boolean;
  errorMessage: string | null;
  runState: "idle" | "queued" | "running";
  runResult: ExternalServicesRunResultValue | null;
  journal: ExternalServicesJournalProps;
  queue?: ExternalServicesQueueProps;
  onChange: (draft: ExternalServicesRequestDraft) => void;
  onCommitName: (name: string) => void;
  onSave: () => void;
  onRunNow: () => void;
  onDelete: () => void;
}>;

function tabCountLabel(base: string, count: number): string {
  return count > 0 ? `${base} (${count})` : base;
}

/**
 * - Purpose: Postman-like request editor with URL bar, tabs, and response pane.
 * - Inputs: draft projection, collection vars, run/journal state, intent callbacks.
 * - Outputs: presentational editor intents without HTTP or mutation logic.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestEditor(
  props: ExternalServicesRequestEditorProps,
): JSX.Element {
  const { t } = useI18n();
  const {
    collectionName,
    collectionVariableKeys,
    draft,
    busy,
    errorMessage,
    runState,
    runResult,
    journal,
    queue,
    onChange,
    onCommitName,
    onSave,
    onRunNow,
    onDelete,
  } = props;
  const change = (patch: Partial<ExternalServicesRequestDraft>): void =>
    onChange({ ...draft, ...patch });
  const [insertTarget, setInsertTarget] = useState<ExternalServicesVariableInsertTarget>("url");
  const urlCaretRef = useRef<number | null>(null);
  const bodyCaretRef = useRef<number | null>(null);
  const bodyInsertAvailable = draft.body.mode !== "none";
  const enabledQueryCount = draft.query.filter((row) => row.enabled).length;
  const enabledHeaderCount = draft.headers.filter((row) => row.enabled).length;
  const enabledTriggerCount = draft.triggers.length;

  const insertToken = (token: string): void => {
    if (insertTarget === "body" && bodyInsertAvailable) {
      const applied = insertTemplateTokenAtCaret(
        draft.body.value,
        token,
        bodyCaretRef.current,
      );
      bodyCaretRef.current = applied.nextCaret;
      change({ body: { ...draft.body, value: applied.nextValue } });
      return;
    }
    const applied = insertTemplateTokenAtCaret(draft.url, token, urlCaretRef.current);
    urlCaretRef.current = applied.nextCaret;
    change({ url: applied.nextValue });
    setInsertTarget("url");
  };

  return (
    <section className={styles.editorWorkspace} data-testid="external-services-request-editor">
      <header className={styles.editorTopBar}>
        <nav
          className={styles.breadcrumb}
          aria-label={t("settings.integrations.externalServices.workspace.breadcrumb")}
        >
          <span className={styles.breadcrumbItem}>{collectionName}</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">
            ›
          </span>
          <ExternalServicesInlineRename
            value={draft.name}
            disabled={busy}
            ariaLabel={t("settings.integrations.externalServices.editor.name")}
            testId="external-services-request-name"
            onCommit={onCommitName}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            data-testid="external-services-save"
            onClick={onSave}
          >
            {t("settings.integrations.externalServices.actions.save")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                aria-label={t("settings.integrations.externalServices.requests.menuLabel")}
              >
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

      {errorMessage !== null ? (
        <p className={styles.editorError} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <ExternalServicesRequestUrlBar
        method={draft.method}
        url={draft.url}
        busy={busy}
        runState={runState}
        collectionVariableKeys={collectionVariableKeys}
        onMethodChange={(method) => change({ method })}
        onUrlChange={(url) => change({ url })}
        onUrlFocus={() => setInsertTarget("url")}
        onUrlCaretChange={(caretIndex) => {
          urlCaretRef.current = caretIndex;
        }}
        onRunNow={onRunNow}
      />

      <div className={styles.editorSplit}>
        <div className={styles.editorTabsPane}>
          <Tabs defaultValue="params">
            <TabsList>
              <TabsTrigger value="params">
                {tabCountLabel(
                  t("settings.integrations.externalServices.tabs.params"),
                  enabledQueryCount,
                )}
              </TabsTrigger>
              <TabsTrigger value="headers">
                {tabCountLabel(
                  t("settings.integrations.externalServices.tabs.headers"),
                  enabledHeaderCount,
                )}
              </TabsTrigger>
              <TabsTrigger value="body">
                {t("settings.integrations.externalServices.tabs.body")}
              </TabsTrigger>
              <TabsTrigger value="triggers">
                {tabCountLabel(
                  t("settings.integrations.externalServices.tabs.triggers"),
                  enabledTriggerCount,
                )}
              </TabsTrigger>
              <TabsTrigger value="variables">
                {t("settings.integrations.externalServices.tabs.variables")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="params" className={styles.editorTabBody}>
              <ExternalServicesKeyValueTable
                testId="external-services-query-table"
                label={t("settings.integrations.externalServices.editor.query")}
                rows={draft.query}
                disabled={busy}
                collectionVariableKeys={collectionVariableKeys}
                onChange={(query) => change({ query })}
              />
            </TabsContent>
            <TabsContent value="headers" className={styles.editorTabBody}>
              <ExternalServicesKeyValueTable
                testId="external-services-headers-table"
                label={t("settings.integrations.externalServices.editor.headers")}
                rows={draft.headers}
                disabled={busy}
                collectionVariableKeys={collectionVariableKeys}
                onChange={(headers) => change({ headers })}
              />
            </TabsContent>
            <TabsContent value="body" className={styles.editorTabBody}>
              <ExternalServicesBodyModeRadios
                value={draft.body.mode}
                disabled={busy}
                onChange={(mode) =>
                  change({
                    body: {
                      mode,
                      value: mode === "none" ? "" : draft.body.value,
                    },
                  })
                }
              />
              {draft.body.mode !== "none" ? (
                <FormField label={t("settings.integrations.externalServices.editor.body")}>
                  <ExternalServicesTemplateField
                    variant="textarea"
                    value={draft.body.value}
                    disabled={busy}
                    collectionVariableKeys={collectionVariableKeys}
                    data-testid="external-services-body-editor"
                    onFocus={() => setInsertTarget("body")}
                    onCaretChange={(caretIndex) => {
                      bodyCaretRef.current = caretIndex;
                    }}
                    onValueChange={(bodyValue) =>
                      change({ body: { ...draft.body, value: bodyValue } })
                    }
                  />
                </FormField>
              ) : null}
            </TabsContent>
            <TabsContent value="triggers" className={styles.editorTabBody}>
              <ExternalServicesTriggerList
                triggers={draft.triggers}
                disabled={busy}
                onChange={(triggers) => change({ triggers })}
              />
            </TabsContent>
            <TabsContent value="variables" className={styles.editorTabBody}>
              <ExternalServicesSystemVariablesHelp
                insertTarget={insertTarget}
                bodyInsertAvailable={bodyInsertAvailable}
                onInsertToken={insertToken}
              />
            </TabsContent>
          </Tabs>
        </div>
        <ExternalServicesResponsePane
          runState={runState}
          runResult={runResult}
          journal={journal}
          {...(queue !== undefined ? { queue } : {})}
        />
      </div>
    </section>
  );
}
