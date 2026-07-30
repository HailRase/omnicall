import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button, Input, Switch } from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesKeyValueRow = Readonly<{
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}>;

export type ExternalServicesKeyValueTableProps = Readonly<{
  testId: string;
  label: string;
  rows: ReadonlyArray<ExternalServicesKeyValueRow>;
  disabled: boolean;
  onChange: (rows: ReadonlyArray<ExternalServicesKeyValueRow>) => void;
}>;

/**
 * - Purpose: compact query/header key-value editor rows.
 * - Inputs: rows, disabled state, localized label and callback.
 * - Outputs: immutable row-change intents without request construction.
 * @uiMeta f=F-031
 */
export function ExternalServicesKeyValueTable({
  testId,
  label,
  rows,
  disabled,
  onChange,
}: ExternalServicesKeyValueTableProps): JSX.Element {
  const { t } = useI18n();
  const update = (id: string, patch: Partial<ExternalServicesKeyValueRow>): void =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const addRow = (): void =>
    onChange([...rows, { id: globalThis.crypto.randomUUID(), key: "", value: "", enabled: true }]);

  return (
    <section className={styles.keyValueTable} data-testid={testId}>
      <h4 className={styles.sectionTitle}>{label}</h4>
      <div className={styles.keyValueRows}>
        {rows.map((row) => (
          <div className={styles.keyValueRow} key={row.id}>
            <Input
              value={row.key}
              size="sm"
              className={styles.keyValueField}
              disabled={disabled}
              aria-label={`${label}: ${t("settings.integrations.externalServices.editor.key")}`}
              onChange={(event) => update(row.id, { key: event.currentTarget.value })}
            />
            <Input
              value={row.value}
              size="sm"
              className={styles.keyValueField}
              disabled={disabled}
              aria-label={`${label}: ${t("settings.integrations.externalServices.editor.value")}`}
              onChange={(event) => update(row.id, { value: event.currentTarget.value })}
            />
            <div className={styles.keyValueEnabled}>
              <Switch
                checked={row.enabled}
                disabled={disabled}
                aria-label={`${label}: ${t("settings.integrations.externalServices.editor.enabled")}`}
                onCheckedChange={(enabled) => update(row.id, { enabled })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={t("settings.integrations.externalServices.editor.removeRow")}
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              {t("settings.integrations.externalServices.actions.delete")}
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={styles.keyValueAdd}
        disabled={disabled}
        onClick={addRow}
      >
        {t("settings.integrations.externalServices.editor.addRow")}
      </Button>
    </section>
  );
}
