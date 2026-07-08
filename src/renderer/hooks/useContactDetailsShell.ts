import { useCallback, useMemo, useState } from "react";
import { deriveContactsShell } from "@application/projections/contacts/deriveContactsShell.js";
import type { ContactShellViewModel } from "@application/projections/contacts/deriveContactsShell.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useI18n } from "../i18n/index.js";
import type { Translator } from "../i18n/index.js";
import type { UseContactActionsResult } from "./useContactActions.js";
import { useShellRouteDataStore } from "../navigation/routeData/useShellRouteDataStore.js";
import type { ContactRouteSnapshot } from "../navigation/routeData/shellRouteDataModel.js";

type UseContactDetailsShellInput = Readonly<{
  contactId: string;
  routeNotFound: boolean;
  isSipRegistered: boolean;
  actions: UseContactActionsResult;
}>;

export type ContactDetailsViewModel = Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
  callDisabledReason: string | null;
}>;

export type UseContactDetailsShellResult = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  contact: ContactDetailsViewModel | null;
  deleteConfirmationOpen: boolean;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
  openDeleteConfirmation: () => void;
  closeDeleteConfirmation: () => void;
  confirmDelete: () => Promise<boolean>;
}>;

/**
 * - Purpose: map route-loaded contact data into localized details view-model.
 * - Inputs: contact id, route not-found flag, registration flag, delete actions.
 * - Outputs: localized contact details and delete confirmation lifecycle.
 */
export function useContactDetailsShell({
  contactId,
  routeNotFound,
  isSipRegistered,
  actions,
}: UseContactDetailsShellInput): UseContactDetailsShellResult {
  const { t } = useI18n();
  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);
  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);
  const activeContact = useShellRouteDataStore((state) => state.activeContact);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const shell = useMemo(
    () =>
      deriveContactsShell({
        projection: contactsProjection,
        isSipRegistered,
        multiCallProjection,
      }),
    [contactsProjection, isSipRegistered, multiCallProjection],
  );

  const projectionContact = useMemo(
    () => shell.contacts.find((entry) => entry.id === contactId) ?? null,
    [contactId, shell.contacts],
  );

  const routeContact = useMemo(
    () => resolveRouteContact(contactId, routeNotFound, activeContact, projectionContact, t),
    [activeContact, contactId, projectionContact, routeNotFound, t],
  );

  const openDeleteConfirmation = useCallback((): void => {
    setDeleteErrorMessage(null);
    setDeleteConfirmationOpen(true);
  }, []);

  const closeDeleteConfirmation = useCallback((): void => {
    setDeleteConfirmationOpen(false);
    setDeleteErrorMessage(null);
  }, []);

  const deleteContact = actions.deleteContact;

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    const result = await deleteContact(contactId);
    setIsDeleting(false);

    if (isErr(result)) {
      setDeleteErrorMessage(t("contacts.error.deleteFailed"));
      return false;
    }

    setDeleteConfirmationOpen(false);
    return true;
  }, [contactId, deleteContact, t]);

  return {
    isLoading: routeContact.isLoading,
    isNotFound: routeContact.isNotFound,
    contact: routeContact.contact,
    deleteConfirmationOpen,
    deleteErrorMessage,
    isDeleting,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDelete,
  };
}

function resolveRouteContact(
  contactId: string,
  routeNotFound: boolean,
  activeContact: ReturnType<typeof useShellRouteDataStore.getState>["activeContact"],
  projectionContact: ContactShellViewModel | null,
  t: Translator,
): Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  contact: ContactDetailsViewModel | null;
}> {
  if (routeNotFound) {
    return {
      isLoading: false,
      isNotFound: true,
      contact: null,
    };
  }

  if (activeContact === null || activeContact.contactId !== contactId) {
    return {
      isLoading: true,
      isNotFound: false,
      contact: null,
    };
  }

  if (activeContact.status === "loading") {
    return {
      isLoading: true,
      isNotFound: false,
      contact: null,
    };
  }

  if (activeContact.status === "notFound" || activeContact.status === "failed") {
    return {
      isLoading: false,
      isNotFound: activeContact.status === "notFound",
      contact: null,
    };
  }

  if (projectionContact !== null) {
    return {
      isLoading: false,
      isNotFound: false,
      contact: mapContactDetails(projectionContact, t),
    };
  }

  if (activeContact.snapshot !== null) {
    return {
      isLoading: false,
      isNotFound: false,
      contact: mapSnapshotToDetails(activeContact.snapshot),
    };
  }

  return {
    isLoading: false,
    isNotFound: false,
    contact: null,
  };
}

function mapContactDetails(
  contact: ContactShellViewModel,
  t: Translator,
): ContactDetailsViewModel {
  return {
    id: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    notes: contact.notes,
    callDisabledReason:
      contact.callDisabledReasonKey !== null ? t(contact.callDisabledReasonKey) : null,
  };
}

function mapSnapshotToDetails(snapshot: ContactRouteSnapshot): ContactDetailsViewModel {
  return {
    id: snapshot.id,
    displayName: snapshot.displayName,
    primaryPhone: snapshot.primaryPhone,
    secondaryPhone: snapshot.secondaryPhone,
    company: snapshot.company,
    notes: snapshot.notes,
    callDisabledReason: null,
  };
}
