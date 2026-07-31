import { useMemo, useState, type JSX } from "react";
import {
  hasBlockingExternalServiceCollectionVariableIssues,
  inspectExternalServiceCollectionVariableRows,
  type ExternalServicesCollectionVariableVm,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/index.js";
import { ExternalServicesCollectionVariableRow } from "./ExternalServicesCollectionVariableRow.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesVariablesDialogProps = Readonly<{
  open: boolean;
  collectionName: string;
  initialVariables: ReadonlyArray<ExternalServicesCollectionVariableVm>;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (variables: ReadonlyArray<ExternalServicesCollectionVariableVm>) => void;
}>;

/**
 * - Purpose: edit collection variables for External Services templates.
 * - Inputs: open state, initial rows, busy flag, and save callback.
 * - Outputs: dialog form without Domain or facade access.
 * @uiMeta f=F-031
 */
export function ExternalServicesVariablesDialog({
  open,
  collectionName,
  initialVariables,
  busy,
  onOpenChange,
  onSave,
}: ExternalServicesVariablesDialogProps): JSX.Element {
  const { t } = useI18n();
  const [rows, setRows] = useState<ReadonlyArray<ExternalServicesCollectionVariableVm>>(
    initialVariables,
  );
  const [attemptedSave, setAttemptedSave] = useState(false);

  const inspections = useMemo(
    () => inspectExternalServiceCollectionVariableRows(rows),
    [rows],
  );
  const inspectionByIndex = useMemo(() => {
    const map = new Map<number, ReadonlyArray<string>>();
    for (const inspection of inspections) {
      map.set(inspection.index, inspection.issues);
    }
    return map;
  }, [inspections]);
  const hasBlockingIssues = hasBlockingExternalServiceCollectionVariableIssues(inspections);
  const hasSystemNameWarning = inspections.some((inspection) =>
    inspection.issues.includes("system_name"),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setRows(initialVariables);
          setAttemptedSave(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent size="md" closeLabel={t("settings.integrations.externalServices.actions.cancel")}>
        <DialogHeader>
          <DialogTitle>
            {t("settings.integrations.externalServices.collections.variablesTitle")}
          </DialogTitle>
          <DialogDescription>
            {collectionName}.{" "}
            {t("settings.integrations.externalServices.collections.variablesDescription")}
          </DialogDescription>
        </DialogHeader>
        <p className={styles.variablesExample} data-testid="external-services-variables-example">
          {t("settings.integrations.externalServices.collections.variablesExample")}
        </p>
        {hasSystemNameWarning ? (
          <p
            className={styles.variablesWarning}
            role="status"
            data-testid="external-services-variables-system-warning"
          >
            {t("settings.integrations.externalServices.collections.variablesSystemWarning")}
          </p>
        ) : null}
        <div className={styles.variablesList} data-testid="external-services-collection-variables-editor">
          {rows.length === 0 ? (
            <p className={styles.description}>
              {t("settings.integrations.externalServices.collections.variablesEmpty")}
            </p>
          ) : null}
          {rows.map((row, index) => {
            const issues = inspectionByIndex.get(index) ?? [];
            const keyError =
              attemptedSave && issues.includes("empty_key")
                ? t("settings.integrations.externalServices.validation.emptyVariableKey")
                : attemptedSave && issues.includes("duplicate_key")
                  ? t("settings.integrations.externalServices.validation.duplicateVariableKey")
                  : undefined;
            const keyHint =
              issues.includes("system_name") && keyError === undefined
                ? t("settings.integrations.externalServices.collections.variablesSystemHint")
                : undefined;
            return (
              <ExternalServicesCollectionVariableRow
                key={`variable-${index}`}
                keyValue={row.key}
                value={row.value}
                busy={busy}
                keyError={keyError}
                keyHint={keyHint}
                onKeyChange={(value) => {
                  setRows((previous) =>
                    previous.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, key: value } : entry,
                    ),
                  );
                }}
                onValueChange={(value) => {
                  setRows((previous) =>
                    previous.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, value } : entry,
                    ),
                  );
                }}
                onRemove={() => {
                  setRows((previous) =>
                    previous.filter((_, entryIndex) => entryIndex !== index),
                  );
                }}
              />
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setRows((previous) => [...previous, { key: "", value: "" }]);
            }}
          >
            {t("settings.integrations.externalServices.collections.variablesAdd")}
          </Button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t("settings.integrations.externalServices.actions.cancel")}
          </Button>
          <Button
            type="button"
            loading={busy}
            disabled={busy}
            onClick={() => {
              setAttemptedSave(true);
              if (hasBlockingIssues) {
                return;
              }
              onSave(rows);
            }}
          >
            {t("settings.integrations.externalServices.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
