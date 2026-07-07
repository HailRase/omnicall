import type { JSX } from "react";
import { Button } from "../ui/button/Button.js";
import { FormField } from "../ui/form-field/FormField.js";
import { Input } from "../ui/input/Input.js";
import { Textarea } from "../ui/textarea/Textarea.js";
import { useI18n } from "../../i18n/index.js";
import type { ContactFormFieldErrors, ContactFormValues } from "../../hooks/useContactEditShell.js";
import styles from "./ContactsPanelShell.module.css";

export type ContactEditPanelProps = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  isSaving: boolean;
  values: ContactFormValues;
  fieldErrors: ContactFormFieldErrors;
  formErrorMessage: string | null;
  successMessage: string | null;
  onFieldChange: (field: keyof ContactFormValues, value: string) => void;
  onSubmit: () => void;
}>;

/**
 * - Purpose: render contact create/edit form inside contacts sidebar body.
 * - Inputs: form values, validation errors, and submit callback.
 * - Outputs: localized form with field-level error wiring.
 */
export function ContactEditPanel({
  isLoading,
  isNotFound,
  isSaving,
  values,
  fieldErrors,
  formErrorMessage,
  successMessage,
  onFieldChange,
  onSubmit,
}: ContactEditPanelProps): JSX.Element {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <p className={styles.stateMessage} data-testid="contacts-edit-loading">
        {t("contacts.loading")}
      </p>
    );
  }

  if (isNotFound) {
    return (
      <p className={styles.stateMessage} data-testid="contacts-edit-not-found">
        {t("contacts.notFound")}
      </p>
    );
  }

  return (
    <form
      className={styles.form}
      data-testid="contacts-edit-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {successMessage !== null ? (
        <p className={styles.stateMessageSuccess} data-testid="contacts-edit-success" role="status">
          {successMessage}
        </p>
      ) : null}
      {formErrorMessage !== null ? (
        <p className={styles.stateMessageError} data-testid="contacts-edit-error" role="alert">
          {formErrorMessage}
        </p>
      ) : null}

      <FormField
        label={t("contacts.field.displayName")}
        required
        error={fieldErrors.displayName}
      >
        <Input
          value={values.displayName}
          invalid={fieldErrors.displayName !== undefined}
          data-testid="contacts-field-display-name"
          onChange={(event) => {
            onFieldChange("displayName", event.target.value);
          }}
        />
      </FormField>

      <FormField
        label={t("contacts.field.primaryPhone")}
        required
        error={fieldErrors.primaryPhone}
      >
        <Input
          value={values.primaryPhone}
          invalid={fieldErrors.primaryPhone !== undefined}
          data-testid="contacts-field-primary-phone"
          onChange={(event) => {
            onFieldChange("primaryPhone", event.target.value);
          }}
        />
      </FormField>

      <FormField label={t("contacts.field.secondaryPhone")} error={fieldErrors.secondaryPhone}>
        <Input
          value={values.secondaryPhone}
          invalid={fieldErrors.secondaryPhone !== undefined}
          data-testid="contacts-field-secondary-phone"
          onChange={(event) => {
            onFieldChange("secondaryPhone", event.target.value);
          }}
        />
      </FormField>

      <FormField label={t("contacts.field.company")} error={fieldErrors.company}>
        <Input
          value={values.company}
          invalid={fieldErrors.company !== undefined}
          data-testid="contacts-field-company"
          onChange={(event) => {
            onFieldChange("company", event.target.value);
          }}
        />
      </FormField>

      <FormField label={t("contacts.field.notes")} error={fieldErrors.notes}>
        <Textarea
          value={values.notes}
          invalid={fieldErrors.notes !== undefined}
          rows={4}
          data-testid="contacts-field-notes"
          onChange={(event) => {
            onFieldChange("notes", event.target.value);
          }}
        />
      </FormField>

      <div className={styles.actionsRow}>
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving}
          data-testid="contacts-save"
        >
          {t("contacts.save")}
        </Button>
      </div>
    </form>
  );
}
