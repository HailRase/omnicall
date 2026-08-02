import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ContactsCsvImportSummary } from "@application/use-cases/contacts/ImportContactsCsvUseCase.js";
import { isErr } from "@shared/result/index.js";
import { ContactsImportSummaryPanel } from "../../components/contacts/ContactsImportSummaryPanel.js";
import {
  ContactDeleteConfirmationModal,
} from "../../components/contacts/ContactDeleteConfirmationModal.js";
import { ContactDetailsPanel } from "../../components/contacts/ContactsPanelShell.js";
import { ContactEditPanel } from "../../components/contacts/ContactEditPanel.js";
import {
  ContactsListPanel,
  ContactsPanelShell,
} from "../../components/contacts/ContactsPanelShell.js";
import { useAuthShellFlags } from "../../hooks/useAuthShellFlags.js";
import { useContactActions } from "../../hooks/useContactActions.js";
import { useContactDetailsShell } from "../../hooks/useContactDetailsShell.js";
import { useDialogReturnFocus } from "../../hooks/useDialogReturnFocus.js";
import { NEW_CONTACT_ROUTE_ID, useContactEditShell } from "../../hooks/useContactEditShell.js";
import { useContactsShell } from "../../hooks/useContactsShell.js";
import { useI18n } from "../../i18n/index.js";
import type { NotificationDescriptor } from "../../hooks/useNotifications.js";
import { useShellNavigation } from "../../navigation/useShellNavigation.js";
import { useShellRouteDataStore } from "../../navigation/routeData/useShellRouteDataStore.js";

type ContactsShellRoutePanelProps = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

/**
 * - Purpose: render contacts routes as sidebar overlays over mounted dialpad/call shell.
 * - Inputs: account bootstrap facade and active contacts hash routes.
 * - Outputs: localized list/details/edit panels wired to facade actions.
 */
export function ContactsShellRoutePanel({
  facade,
  notify,
}: ContactsShellRoutePanelProps): JSX.Element | null {
  const { route, navigateTo, goToDialpad, goBackSafe } = useShellNavigation();
  const [restoreFocusContactId, setRestoreFocusContactId] = useState<string | null>(null);

  if (
    route.name !== "contacts" &&
    route.name !== "contactDetails" &&
    route.name !== "contactEdit"
  ) {
    return null;
  }

  if (route.name === "contacts") {
    return (
      <ContactsListRoute
        facade={facade}
        restoreFocusContactId={restoreFocusContactId}
        onRestoreFocusHandled={() => {
          setRestoreFocusContactId(null);
        }}
        onClose={goToDialpad}
        {...(notify !== undefined ? { notify } : {})}
      />
    );
  }

  if (route.name === "contactDetails") {
    return (
      <ContactsDetailsRoute
        facade={facade}
        contactId={route.contactId}
        routeNotFound={route.notFound}
        onClose={goToDialpad}
        onBack={() => {
          setRestoreFocusContactId(route.contactId);
          navigateTo({ name: "contacts" });
        }}
        onReturnToList={(contactId) => {
          setRestoreFocusContactId(contactId);
          navigateTo({ name: "contacts" });
        }}
        {...(notify !== undefined ? { notify } : {})}
      />
    );
  }

  return (
    <ContactsEditRoute
      facade={facade}
      contactId={route.contactId}
      routeNotFound={route.notFound}
      onClose={goToDialpad}
      onBack={goBackSafe}
      {...(notify !== undefined ? { notify } : {})}
    />
  );
}

type ContactsListRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  restoreFocusContactId: string | null;
  onRestoreFocusHandled: () => void;
  notify?: (descriptor: NotificationDescriptor) => void;
  onClose: () => void;
}>;

function ContactsListRoute({
  facade,
  restoreFocusContactId,
  onRestoreFocusHandled,
  notify,
  onClose,
}: ContactsListRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useContactActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const contactsShell = useContactsShell({
    isSipRegistered,
  });
  const [importSummary, setImportSummary] = useState<ContactsCsvImportSummary | null>(null);
  const [importSummaryOpen, setImportSummaryOpen] = useState(false);
  const { triggerRef: csvMenuTriggerRef, onCloseAutoFocus: onImportSummaryCloseAutoFocus } =
    useDialogReturnFocus<HTMLButtonElement>();

  return (
    <>
      <ContactsPanelShell open title={t("contacts.title")} onClose={onClose}>
        <ContactsListPanel
          isLoading={contactsShell.isLoading}
          isEmpty={contactsShell.isEmpty}
          errorMessage={contactsShell.errorMessage}
          rows={contactsShell.rows}
          restoreFocusContactId={restoreFocusContactId}
          onRestoreFocusHandled={onRestoreFocusHandled}
          csvMenuButtonRef={csvMenuTriggerRef}
          onSelectContact={(contactId) => {
            navigateTo({ name: "contactDetails", contactId });
          }}
          onAddContact={() => {
            useShellRouteDataStore.getState().clearContactCreatePrefill();
            navigateTo({ name: "contactEdit", contactId: NEW_CONTACT_ROUTE_ID });
          }}
          onImportCsv={() => {
            void (async () => {
              const result = await actions.importContactsCsv();
              if (result.kind !== "imported") {
                return;
              }
              if (
                result.summary.failedRows.length > 0 ||
                result.summary.skippedDuplicateCount > 0
              ) {
                setImportSummary(result.summary);
                setImportSummaryOpen(true);
              }
            })();
          }}
          onExportCsv={() => {
            void actions.exportContactsCsv();
          }}
          onQuickCall={(contactId) => {
            void (async () => {
              const result = await actions.callContact(contactId);
              if (!isErr(result)) {
                goToDialpad();
              }
            })();
          }}
        />
      </ContactsPanelShell>
      <ContactsImportSummaryPanel
        open={importSummaryOpen}
        summary={importSummary}
        onCloseAutoFocus={onImportSummaryCloseAutoFocus}
        onClose={() => {
          setImportSummaryOpen(false);
          setImportSummary(null);
        }}
      />
    </>
  );
}

type ContactsDetailsRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  contactId: string;
  routeNotFound: boolean;
  notify?: (descriptor: NotificationDescriptor) => void;
  onClose: () => void;
  onBack: () => void;
  onReturnToList: (contactId: string) => void;
}>;

function ContactsDetailsRoute({
  facade,
  contactId,
  routeNotFound,
  notify,
  onClose,
  onBack,
  onReturnToList,
}: ContactsDetailsRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useContactActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const { triggerRef: deleteTriggerRef, onCloseAutoFocus } =
    useDialogReturnFocus<HTMLButtonElement>();
  const detailsShell = useContactDetailsShell({
    contactId,
    routeNotFound,
    isSipRegistered,
    actions,
  });

  const title = detailsShell.contact?.displayName ?? t("contacts.details.title");

  return (
    <>
      <ContactsPanelShell open title={title} showBack onClose={onClose} onBack={onBack}>
        <ContactDetailsPanel
          isLoading={detailsShell.isLoading}
          isNotFound={detailsShell.isNotFound}
          contact={detailsShell.contact}
          deleteButtonRef={deleteTriggerRef}
          onCall={() => {
            void (async () => {
              const result = await actions.callContact(contactId);
              if (!isErr(result)) {
                goToDialpad();
              }
            })();
          }}
          onEdit={() => {
            navigateTo({ name: "contactEdit", contactId });
          }}
          onDelete={detailsShell.openDeleteConfirmation}
        />
      </ContactsPanelShell>
      <ContactDeleteConfirmationModal
        open={detailsShell.deleteConfirmationOpen}
        contactName={detailsShell.contact?.displayName ?? null}
        isDeleting={detailsShell.isDeleting}
        onCloseAutoFocus={onCloseAutoFocus}
        onCancel={detailsShell.closeDeleteConfirmation}
        onConfirm={() => {
          void (async () => {
            const deleted = await detailsShell.confirmDelete();
            if (deleted) {
              onReturnToList(contactId);
            }
          })();
        }}
      />
    </>
  );
}

type ContactsEditRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  contactId: string;
  routeNotFound: boolean;
  notify?: (descriptor: NotificationDescriptor) => void;
  onClose: () => void;
  onBack: () => void;
}>;

function ContactsEditRoute({
  facade,
  contactId,
  routeNotFound,
  notify,
  onClose,
  onBack,
}: ContactsEditRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo } = useShellNavigation();
  const actions = useContactActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const editShell = useContactEditShell({
    contactId,
    routeNotFound,
    actions,
  });

  const title = editShell.isCreateMode ? t("contacts.create.title") : t("contacts.edit.title");

  return (
    <ContactsPanelShell open title={title} showBack onClose={onClose} onBack={onBack}>
      <ContactEditPanel
        isLoading={editShell.isLoading}
        isNotFound={editShell.isNotFound}
        isSaving={editShell.isSaving}
        values={editShell.values}
        fieldErrors={editShell.fieldErrors}
        onFieldChange={editShell.onFieldChange}
        onSubmit={() => {
          void (async () => {
            const savedId = await editShell.onSubmit();
            if (savedId === null) {
              return;
            }
            useShellRouteDataStore.getState().clearContactCreatePrefill();
            navigateTo({ name: "contactDetails", contactId: savedId });
          })();
        }}
      />
    </ContactsPanelShell>
  );
}
