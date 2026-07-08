import { useMemo, useState, type ChangeEvent, type JSX, type ReactNode, type Ref } from "react";
import { ShellDialpadPanel } from "../shell/ShellDialpadPanel.js";
import { Button } from "../ui/button/Button.js";
import { Input } from "../ui/input/Input.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu/index.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { ListQuickCallButton } from "../list/ListQuickCallButton.js";
import { PersonListAvatar } from "../list/PersonListAvatar.js";
import { useRestoreRouteFocus } from "../../hooks/useRestoreRouteFocus.js";
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
    callDisabledReason: string | null;
  }>;
  restoreFocusContactId?: string | null;
  onRestoreFocusHandled?: () => void;
  csvMenuButtonRef?: Ref<HTMLButtonElement>;
  onSelectContact: (contactId: string) => void;
  onAddContact: () => void;
  onImportCsv: () => void;
  onExportCsv: () => void;
  onQuickCall: (contactId: string) => void;
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
  restoreFocusContactId = null,
  onRestoreFocusHandled,
  csvMenuButtonRef,
  onSelectContact,
  onAddContact,
  onImportCsv,
  onExportCsv,
  onQuickCall,
}: ContactsListPanelProps): JSX.Element {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  useRestoreRouteFocus({
    targetTestId:
      restoreFocusContactId !== null ? `contacts-list-item-${restoreFocusContactId}` : null,
    ...(onRestoreFocusHandled !== undefined ? { onHandled: onRestoreFocusHandled } : {}),
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      const haystack = [row.displayName, row.primaryPhone, row.company ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, searchQuery]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

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
      <div className={styles.emptyState} data-testid="contacts-list-empty">
        <AppIcon id="shell.contacts" decorative size={24} className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>{t("contacts.empty")}</p>
        <p className={styles.emptyHint}>{t("contacts.emptyHint")}</p>
        <div className={styles.actionsRow}>
          <ContactsCsvMenu
            {...(csvMenuButtonRef !== undefined ? { menuButtonRef: csvMenuButtonRef } : {})}
            onImportCsv={onImportCsv}
            onExportCsv={onExportCsv}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={styles.emptyAddButton}
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
      <div className={styles.listToolbar}>
        <Input
          type="search"
          size="sm"
          value={searchQuery}
          placeholder={t("contacts.searchPlaceholder")}
          aria-label={t("contacts.searchAriaLabel")}
          data-testid="contacts-search-input"
          onChange={handleSearchChange}
        />
        <div className={styles.listToolbarActions}>
          <ContactsCsvMenu
            {...(csvMenuButtonRef !== undefined ? { menuButtonRef: csvMenuButtonRef } : {})}
            onImportCsv={onImportCsv}
            onExportCsv={onExportCsv}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="contacts-add"
            onClick={onAddContact}
          >
            {t("contacts.add")}
          </Button>
        </div>
      </div>
      {filteredRows.length === 0 ? (
        <p className={styles.stateMessage} data-testid="contacts-list-search-empty">
          {t("contacts.empty")}
        </p>
      ) : (
        <ul className={styles.list} data-testid="contacts-list">
          {filteredRows.map((row) => (
            <li key={row.id} className={styles.listItemRow}>
              <button
                type="button"
                className={styles.listItemMain}
                data-testid={`contacts-list-item-${row.id}`}
                onClick={() => {
                  onSelectContact(row.id);
                }}
              >
                <PersonListAvatar label={row.displayName} size="sm" />
                <span className={styles.listItemText}>
                  <span className={styles.listItemName}>{row.displayName}</span>
                  <span className={styles.listItemSubline}>{row.primaryPhone}</span>
                  {row.company !== null ? (
                    <span className={styles.listItemSubline}>{row.company}</span>
                  ) : null}
                </span>
              </button>
              <ListQuickCallButton
                ariaLabel={t("contacts.call")}
                testId={`contacts-quick-call-${row.id}`}
                disabledReason={row.callDisabledReason}
                onClick={() => {
                  onQuickCall(row.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
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
  deleteButtonRef?: Ref<HTMLButtonElement>;
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
  deleteButtonRef,
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
    <div className={styles.detailsLayout} data-testid="contacts-details">
      <div className={styles.detailsHero}>
        <PersonListAvatar label={contact.displayName} size="lg" />
        <h3 className={styles.detailsName}>{contact.displayName}</h3>
        {contact.company !== null ? (
          <p className={styles.detailsSubtitle}>{contact.company}</p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        fullWidth
        className={styles.callActionButton}
        disabled={contact.callDisabledReason !== null}
        title={contact.callDisabledReason ?? undefined}
        data-testid="contacts-call"
        onClick={onCall}
      >
        <AppIcon id="dial.call" decorative size={14} />
        {t("contacts.call")}
      </Button>

      <div className={styles.detailsCard}>
        <DetailRow label={t("contacts.field.primaryPhone")} value={contact.primaryPhone} />
        {contact.secondaryPhone !== null ? (
          <DetailRow label={t("contacts.field.secondaryPhone")} value={contact.secondaryPhone} />
        ) : null}
        {contact.company !== null ? (
          <DetailRow label={t("contacts.field.company")} value={contact.company} />
        ) : null}
        {contact.notes !== null && contact.notes.length > 0 ? (
          <DetailRow label={t("contacts.field.notes")} value={contact.notes} />
        ) : null}
      </div>

      <div className={styles.detailsActions}>
        <Button type="button" variant="outline" size="sm" data-testid="contacts-edit" onClick={onEdit}>
          <AppIcon id="action.edit" decorative size={14} />
          {t("contacts.edit")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          ref={deleteButtonRef}
          data-testid="contacts-delete"
          onClick={onDelete}
        >
          {t("contacts.delete")}
        </Button>
      </div>
    </div>
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

type ContactsCsvMenuProps = Readonly<{
  menuButtonRef?: Ref<HTMLButtonElement>;
  onImportCsv: () => void;
  onExportCsv: () => void;
}>;

function ContactsCsvMenu({ menuButtonRef, onImportCsv, onExportCsv }: ContactsCsvMenuProps): JSX.Element {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          ref={menuButtonRef}
          aria-label={t("contacts.csv.menuAria")}
          data-testid="contacts-csv-menu"
        >
          {t("contacts.csv.menu")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          data-testid="contacts-csv-import"
          onSelect={() => {
            onImportCsv();
          }}
        >
          {t("contacts.csv.import")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="contacts-csv-export"
          onSelect={() => {
            onExportCsv();
          }}
        >
          {t("contacts.csv.export")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
