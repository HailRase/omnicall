import { useState, type JSX } from "react";
import type { ExternalServicesCollectionVariableVm } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from "../../ui/index.js";
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setRows(initialVariables);
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
        <div className={styles.variablesList} data-testid="external-services-collection-variables">
          {rows.length === 0 ? (
            <p className={styles.description}>
              {t("settings.integrations.externalServices.collections.variablesEmpty")}
            </p>
          ) : null}
          {rows.map((row, index) => (
            <div className={styles.variableRow} key={`variable-${index}`}>
              <FormField
                label={t("settings.integrations.externalServices.collections.variablesKey")}
              >
                <Input
                  value={row.key}
                  disabled={busy}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setRows((previous) =>
                      previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, key: value } : entry,
                      ),
                    );
                  }}
                />
              </FormField>
              <FormField
                label={t("settings.integrations.externalServices.collections.variablesValue")}
              >
                <Input
                  value={row.value}
                  disabled={busy}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setRows((previous) =>
                      previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, value } : entry,
                      ),
                    );
                  }}
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                aria-label={t(
                  "settings.integrations.externalServices.collections.variablesRemove",
                )}
                onClick={() => {
                  setRows((previous) =>
                    previous.filter((_, entryIndex) => entryIndex !== index),
                  );
                }}
              >
                {t("settings.integrations.externalServices.actions.delete")}
              </Button>
            </div>
          ))}
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
            onClick={() => {
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
