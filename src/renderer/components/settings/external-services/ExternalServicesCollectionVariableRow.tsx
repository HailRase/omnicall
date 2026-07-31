import type { JSX } from "react";
import { formatExternalServiceVariableToken } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, FormField, Input } from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesCollectionVariableRowProps = Readonly<{
  keyValue: string;
  value: string;
  busy: boolean;
  keyError?: string | undefined;
  keyHint?: string | undefined;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
}>;

/**
 * - Purpose: one editable collection variable key/value row with token preview.
 * - Inputs: row values, validation copy, busy flag, and change callbacks.
 * - Outputs: presentational form row intents only.
 * @uiMeta f=F-031
 */
export function ExternalServicesCollectionVariableRow({
  keyValue,
  value,
  busy,
  keyError,
  keyHint,
  onKeyChange,
  onValueChange,
  onRemove,
}: ExternalServicesCollectionVariableRowProps): JSX.Element {
  const { t } = useI18n();
  const trimmedKey = keyValue.trim();

  return (
    <div className={styles.variableRow}>
      <FormField
        label={t("settings.integrations.externalServices.collections.variablesKey")}
        error={keyError}
        hint={keyHint}
      >
        <Input
          value={keyValue}
          disabled={busy}
          placeholder={t(
            "settings.integrations.externalServices.collections.variablesKeyPlaceholder",
          )}
          onChange={(event) => {
            onKeyChange(event.currentTarget.value);
          }}
        />
      </FormField>
      <FormField label={t("settings.integrations.externalServices.collections.variablesValue")}>
        <Input
          value={value}
          disabled={busy}
          placeholder={t(
            "settings.integrations.externalServices.collections.variablesValuePlaceholder",
          )}
          onChange={(event) => {
            onValueChange(event.currentTarget.value);
          }}
        />
      </FormField>
      <div className={styles.variableRowActions}>
        {trimmedKey.length > 0 ? (
          <code className={styles.variablesTokenPreview}>
            {formatExternalServiceVariableToken(trimmedKey)}
          </code>
        ) : (
          <span className={styles.variablesTokenPlaceholder}>{"{{…}}"}</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          aria-label={t("settings.integrations.externalServices.collections.variablesRemove")}
          onClick={onRemove}
        >
          {t("settings.integrations.externalServices.actions.delete")}
        </Button>
      </div>
    </div>
  );
}
