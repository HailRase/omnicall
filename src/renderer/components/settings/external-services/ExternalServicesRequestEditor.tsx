import { useState, type JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FormField,
  Input,
  Select,
  Switch,
  Textarea,
} from "../../ui/index.js";
import type { ExternalServicesKeyValueRow } from "./ExternalServicesKeyValueTable.js";
import { ExternalServicesKeyValueTable } from "./ExternalServicesKeyValueTable.js";
import { ExternalServicesRunResult, type ExternalServicesRunResultValue } from "./ExternalServicesRunResult.js";
import { ExternalServicesTriggerList, type ExternalServicesAutomaticEventType } from "./ExternalServicesTriggerList.js";
import styles from "./ExternalServices.module.css";
const bodyModeKeys: Readonly<Record<string, TranslationKey>> = {
  none: "settings.integrations.externalServices.bodyMode.none",
  json: "settings.integrations.externalServices.bodyMode.json",
  "x-www-form-urlencoded": "settings.integrations.externalServices.bodyMode.x-www-form-urlencoded",
  raw: "settings.integrations.externalServices.bodyMode.raw",
};

export type ExternalServicesRequestDraft = Readonly<{
  id: string; name: string; enabled: boolean; method: string; url: string;
  query: ReadonlyArray<ExternalServicesKeyValueRow>; headers: ReadonlyArray<ExternalServicesKeyValueRow>;
  body: Readonly<{ mode: string; value: string }>; triggers: ReadonlyArray<ExternalServicesAutomaticEventType>;
}>;
export type ExternalServicesRequestEditorProps = Readonly<{
  draft: ExternalServicesRequestDraft; busy: boolean; errorMessage: string | null;
  isDirty: boolean;
  runState: "idle" | "queued" | "running";
  runResult: ExternalServicesRunResultValue | null;
  onBack: () => void;
  onChange: (draft: ExternalServicesRequestDraft) => void;
  onSave: () => void; onRunNow: () => void; onDelete: () => void;
}>;

/** - Purpose: edit one external request and launch a manual run.
 * - Inputs: draft projection, async state, callbacks, execution result.
 * - Outputs: form and user intents without HTTP or mutation logic.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestEditor({
  draft,
  busy,
  errorMessage,
  isDirty,
  runState,
  runResult,
  onBack,
  onChange,
  onSave,
  onRunNow,
  onDelete,
}: ExternalServicesRequestEditorProps): JSX.Element {
  const { t } = useI18n();
  const [discardOpen, setDiscardOpen] = useState(false);
  const change = (patch: Partial<ExternalServicesRequestDraft>): void => onChange({ ...draft, ...patch });
  const requestBack = (): void => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onBack();
  };
  return <section className={styles.panel} data-testid="external-services-request-editor">
    <header className={styles.header}>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={requestBack}>{t("settings.integrations.externalServices.actions.back")}</Button>
      <FormField label={t("settings.integrations.externalServices.editor.name")}>
        <Input value={draft.name} disabled={busy} data-testid="external-services-request-name" onChange={(event) => change({ name: event.currentTarget.value })} />
      </FormField>
      <Switch checked={draft.enabled} disabled={busy} data-testid="external-services-request-enabled" aria-label={t("settings.integrations.externalServices.editor.enabled")} onCheckedChange={(enabled) => change({ enabled })} />
    </header>
    {errorMessage !== null ? <p className={styles.editorError} role="alert">{errorMessage}</p> : null}
    <div className={styles.editorGrid}>
      <FormField label={t("settings.integrations.externalServices.editor.method")}>
        <Select value={draft.method} disabled={busy} data-testid="external-services-request-method" items={["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({ value, label: value }))} onValueChange={(method) => change({ method })} />
      </FormField>
      <FormField label={t("settings.integrations.externalServices.editor.url")}>
        <Input value={draft.url} disabled={busy} data-testid="external-services-request-url" onChange={(event) => change({ url: event.currentTarget.value })} />
      </FormField>
    </div>
    <ExternalServicesKeyValueTable testId="external-services-query-table" label={t("settings.integrations.externalServices.editor.query")} rows={draft.query} disabled={busy} onChange={(query) => change({ query })} />
    <ExternalServicesKeyValueTable testId="external-services-headers-table" label={t("settings.integrations.externalServices.editor.headers")} rows={draft.headers} disabled={busy} onChange={(headers) => change({ headers })} />
    <FormField label={t("settings.integrations.externalServices.editor.bodyMode")}>
      <Select value={draft.body.mode} disabled={busy} data-testid="external-services-body-mode" items={Object.entries(bodyModeKeys).map(([value, key]) => ({ value, label: t(key) }))} onValueChange={(mode) => change({ body: { ...draft.body, mode } })} />
    </FormField>
    <FormField label={t("settings.integrations.externalServices.editor.body")}>
      <Textarea value={draft.body.value} disabled={busy} data-testid="external-services-body-editor" onChange={(event) => change({ body: { ...draft.body, value: event.currentTarget.value } })} />
    </FormField>
    <ExternalServicesTriggerList triggers={draft.triggers} disabled={busy} onChange={(triggers) => change({ triggers })} />
    <ExternalServicesRunResult result={runResult} runState={runState} />
    <footer className={styles.stickyActions}>
      <Button type="button" variant="destructive" disabled={busy} onClick={onDelete}>{t("settings.integrations.externalServices.actions.delete")}</Button>
      <Button type="button" variant="outline" loading={busy} data-testid="external-services-save" onClick={onSave}>{t("settings.integrations.externalServices.actions.save")}</Button>
      <Button type="button" loading={runState !== "idle"} disabled={busy} data-testid="external-services-run-now" onClick={onRunNow}>{t("settings.integrations.externalServices.run.now")}</Button>
    </footer>
    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.integrations.externalServices.editor.discardTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("settings.integrations.externalServices.editor.discardDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">{t("settings.integrations.externalServices.actions.cancel")}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="destructive" data-testid="external-services-discard-changes" onClick={onBack}>
              {t("settings.integrations.externalServices.editor.discard")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
