import type { JSX, ReactNode } from "react";
import { ShellDialpadPanel } from "../shell/ShellDialpadPanel.js";
import { Button } from "../ui/button/Button.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./ContactsPanelShell.module.css";

export type ContactsPanelShellProps = Readonly<{
  open: boolean;
  title: string;
  showBack?: boolean;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}>;

/**
 * - Purpose: present contacts sidebar over shell body and avatar header.
 * - Inputs: title, optional back navigation, body content, and footer actions.
 * - Outputs: left slide-in region below window controls without blocking them.
 * @uiMeta f=F-025 smoke=contacts-panel
 */
export function ContactsPanelShell({
  open,
  title,
  showBack = false,
  onClose,
  onBack,
  children,
  footer,
}: ContactsPanelShellProps): JSX.Element | null {
  return (
    <ShellDialpadPanel
      open={open}
      title={title}
      testId="contacts-panel-shell"
      closeButtonTestId="contacts-panel-close"
      backButtonTestId="contacts-panel-back"
      presentation="sidebar"
      showBack={showBack}
      onClose={onClose}
      {...(onBack !== undefined ? { onBack } : {})}
      {...(footer !== undefined ? { footer } : {})}
    >
      {children}
    </ShellDialpadPanel>
  );
}

export type ContactsListPanelProps = Readonly<{
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  rows: ReadonlyArray<{
    id: string;
    displayName: string;
    primaryPhone: string;
    company: string | null;
  }>;
  onSelectContact: (contactId: string) => void;
  onAddContact: () => void;
}>;

/**
 * - Purpose: render contacts list states inside contacts sidebar body.
 * - Inputs: load/empty/error states, rows, and selection callbacks.
 * - Outputs: localized list UI with add-contact affordance.
 */
export function ContactsListPanel({
  isLoading,
  isEmpty,
  errorMessage,
  rows,
  onSelectContact,
  onAddContact,
}: ContactsListPanelProps): JSX.Element {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <p className={styles.stateMessage} data-testid="contacts-list-loading">
        {t("contacts.loading")}
      </p>
    );
  }

  if (errorMessage !== null) {
    return (
      <p className={styles.stateMessageError} data-testid="contacts-list-error" role="alert">
        {errorMessage}
      </p>
    );
  }

  if (isEmpty) {
    return (
      <div data-testid="contacts-list-empty">
        <p className={styles.stateMessage}>{t("contacts.empty")}</p>
        <div className={styles.actionsRow}>
          <Button
            type="button"
            variant="primary"
            data-testid="contacts-add-empty"
            onClick={onAddContact}
          >
            {t("contacts.add")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.actionsRow}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="contacts-add"
          onClick={onAddContact}
        >
          {t("contacts.add")}
        </Button>
      </div>
      <ul className={styles.list} data-testid="contacts-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={styles.listItem}
              data-testid={`contacts-list-item-${row.id}`}
              onClick={() => {
                onSelectContact(row.id);
              }}
            >
              <div className={styles.listItemName}>{row.displayName}</div>
              <div className={styles.listItemPhone}>{row.primaryPhone}</div>
              {row.company !== null ? (
                <div className={styles.listItemCompany}>{row.company}</div>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export type ContactDetailsPanelProps = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  contact: Readonly<{
    displayName: string;
    primaryPhone: string;
    secondaryPhone: string | null;
    company: string | null;
    notes: string | null;
    callDisabledReason: string | null;
  }> | null;
  onCall: () => void;
  onEdit: () => void;
  onDelete: () => void;
}>;

/**
 * - Purpose: render contact details states inside contacts sidebar body.
 * - Inputs: loading/not-found/contact snapshot and action callbacks.
 * - Outputs: localized details view with call/edit/delete controls.
 */
export function ContactDetailsPanel({
  isLoading,
  isNotFound,
  contact,
  onCall,
  onEdit,
  onDelete,
}: ContactDetailsPanelProps): JSX.Element {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <p className={styles.stateMessage} data-testid="contacts-details-loading">
        {t("contacts.loading")}
      </p>
    );
  }

  if (isNotFound || contact === null) {
    return (
      <p className={styles.stateMessage} data-testid="contacts-details-not-found">
        {t("contacts.notFound")}
      </p>
    );
  }

  return (
    <>
      <div className={styles.detailsGrid} data-testid="contacts-details">
        <DetailRow label={t("contacts.field.displayName")} value={contact.displayName} />
        <DetailRow label={t("contacts.field.primaryPhone")} value={contact.primaryPhone} />
        {contact.secondaryPhone !== null ? (
          <DetailRow label={t("contacts.field.secondaryPhone")} value={contact.secondaryPhone} />
        ) : null}
        {contact.company !== null ? (
          <DetailRow label={t("contacts.field.company")} value={contact.company} />
        ) : null}
        {contact.notes !== null ? (
          <DetailRow label={t("contacts.field.notes")} value={contact.notes} />
        ) : null}
      </div>
      <div className={styles.actionsRow}>
        <Button
          type="button"
          variant="primary"
          disabled={contact.callDisabledReason !== null}
          title={contact.callDisabledReason ?? undefined}
          data-testid="contacts-call"
          onClick={onCall}
        >
          <AppIcon id="dial.call" decorative size={16} />
          {t("contacts.call")}
        </Button>
        <Button type="button" variant="secondary" data-testid="contacts-edit" onClick={onEdit}>
          {t("contacts.edit")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          data-testid="contacts-delete"
          onClick={onDelete}
        >
          {t("contacts.delete")}
        </Button>
      </div>
    </>
  );
}

type DetailRowProps = Readonly<{
  label: string;
  value: string;
}>;

function DetailRow({ label, value }: DetailRowProps): JSX.Element {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <p className={styles.detailValue}>{value}</p>
    </div>
  );
}
