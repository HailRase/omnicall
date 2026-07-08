import type { JSX } from "react";
import type { ContactsCsvImportSummary } from "@application/use-cases/contacts/ImportContactsCsvUseCase.js";
import type { ContactValidationError } from "@domain/index.js";
import { useI18n, type TranslationKey } from "../../i18n/index.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "../ui/index.js";
import styles from "./ContactsImportSummaryPanel.module.css";

export type ContactsImportSummaryPanelProps = Readonly<{
  open: boolean;
  summary: ContactsCsvImportSummary | null;
  onCloseAutoFocus?: (event: Event) => void;
  onClose: () => void;
}>;

/**
 * - Purpose: present contacts CSV import summary counts and row failures.
 * - Inputs: import summary snapshot and close callback.
 * - Outputs: localized non-blocking alert dialog for partial import outcomes.
 */
export function ContactsImportSummaryPanel({
  open,
  summary,
  onCloseAutoFocus,
  onClose,
}: ContactsImportSummaryPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="contacts-import-summary-panel"
        aria-label={t("contacts.csv.summary.dialogAria")}
        onEscapeKeyDown={onClose}
        {...(onCloseAutoFocus !== undefined ? { onCloseAutoFocus } : {})}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("contacts.csv.summary.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("contacts.csv.summary.description")}</AlertDialogDescription>
        </AlertDialogHeader>

        {summary !== null ? (
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>{t("contacts.csv.summary.created")}</dt>
              <dd data-testid="contacts-import-summary-created">{summary.createdCount}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>{t("contacts.csv.summary.skippedDuplicates")}</dt>
              <dd data-testid="contacts-import-summary-skipped">{summary.skippedDuplicateCount}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>{t("contacts.csv.summary.failed")}</dt>
              <dd data-testid="contacts-import-summary-failed">{summary.failedRows.length}</dd>
            </div>
          </dl>
        ) : null}

        {summary !== null && summary.failedRows.length > 0 ? (
          <ul className={styles.failedList} data-testid="contacts-import-summary-failed-rows">
            {summary.failedRows.map((row) => (
              <li key={row.rowNumber}>
                {t("contacts.csv.summary.failedRow", {
                  row: row.rowNumber,
                  reason: row.errors.map((error) => t(mapValidationErrorMessageKey(error))).join(", "),
                })}
              </li>
            ))}
          </ul>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="outline"
              data-testid="contacts-import-summary-close"
              onClick={onClose}
            >
              {t("contacts.csv.summary.close")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function mapValidationErrorMessageKey(error: ContactValidationError): TranslationKey {
  switch (error) {
    case "display_name_required":
      return "contacts.field.error.displayNameRequired";
    case "display_name_too_long":
      return "contacts.field.error.displayNameTooLong";
    case "primary_phone_invalid":
      return "contacts.field.error.primaryPhoneInvalid";
    case "secondary_phone_invalid":
      return "contacts.field.error.secondaryPhoneInvalid";
    case "primary_phone_duplicate":
      return "contacts.field.error.primaryPhoneDuplicate";
    case "secondary_phone_duplicate":
      return "contacts.field.error.secondaryPhoneDuplicate";
    case "company_too_long":
      return "contacts.field.error.companyTooLong";
    case "notes_too_long":
      return "contacts.field.error.notesTooLong";
  }
}
