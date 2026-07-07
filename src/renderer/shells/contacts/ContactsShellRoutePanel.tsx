import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
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
import { NEW_CONTACT_ROUTE_ID, useContactEditShell } from "../../hooks/useContactEditShell.js";
import { useContactsShell } from "../../hooks/useContactsShell.js";
import { useI18n } from "../../i18n/index.js";
import { useShellNavigation } from "../../navigation/useShellNavigation.js";

type ContactsShellRoutePanelProps = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: render contacts routes as sidebar overlays over mounted dialpad/call shell.
 * - Inputs: account bootstrap facade and active contacts hash routes.
 * - Outputs: localized list/details/edit panels wired to facade actions.
 */
export function ContactsShellRoutePanel({ facade }: ContactsShellRoutePanelProps): JSX.Element | null {
  const { route, navigateTo, goToDialpad, goBackSafe } = useShellNavigation();

  if (
    route.name !== "contacts" &&
    route.name !== "contactDetails" &&
    route.name !== "contactEdit"
  ) {
    return null;
  }

  if (route.name === "contacts") {
    return <ContactsListRoute onClose={goToDialpad} />;
  }

  if (route.name === "contactDetails") {
    return (
      <ContactsDetailsRoute
        facade={facade}
        contactId={route.contactId}
        routeNotFound={route.notFound}
        onClose={goToDialpad}
        onBack={() => {
          navigateTo({ name: "contacts" });
        }}
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
    />
  );
}

type ContactsListRouteProps = Readonly<{
  onClose: () => void;
}>;

function ContactsListRoute({ onClose }: ContactsListRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const contactsShell = useContactsShell({
    isSipRegistered,
  });

  return (
    <ContactsPanelShell open title={t("contacts.title")} onClose={onClose}>
      <ContactsListPanel
        isLoading={contactsShell.isLoading}
        isEmpty={contactsShell.isEmpty}
        errorMessage={contactsShell.errorMessage}
        rows={contactsShell.rows}
        onSelectContact={(contactId) => {
          navigateTo({ name: "contactDetails", contactId });
        }}
        onAddContact={() => {
          navigateTo({ name: "contactEdit", contactId: NEW_CONTACT_ROUTE_ID });
        }}
      />
    </ContactsPanelShell>
  );
}

type ContactsDetailsRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  contactId: string;
  routeNotFound: boolean;
  onClose: () => void;
  onBack: () => void;
}>;

function ContactsDetailsRoute({
  facade,
  contactId,
  routeNotFound,
  onClose,
  onBack,
}: ContactsDetailsRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useContactActions({ facade });
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
        errorMessage={detailsShell.deleteErrorMessage}
        onCancel={detailsShell.closeDeleteConfirmation}
        onConfirm={() => {
          void (async () => {
            const deleted = await detailsShell.confirmDelete();
            if (deleted) {
              navigateTo({ name: "contacts" });
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
  onClose: () => void;
  onBack: () => void;
}>;

function ContactsEditRoute({
  facade,
  contactId,
  routeNotFound,
  onClose,
  onBack,
}: ContactsEditRouteProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo } = useShellNavigation();
  const actions = useContactActions({ facade });
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
        formErrorMessage={editShell.formErrorMessage}
        successMessage={editShell.successMessage}
        onFieldChange={editShell.onFieldChange}
        onSubmit={() => {
          void (async () => {
            const savedId = await editShell.onSubmit();
            if (savedId === null) {
              return;
            }
            navigateTo({ name: "contactDetails", contactId: savedId });
          })();
        }}
      />
    </ContactsPanelShell>
  );
}
