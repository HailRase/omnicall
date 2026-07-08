import { useCallback, useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ContactsCsvImportSummary } from "@application/use-cases/contacts/ImportContactsCsvUseCase.js";
import type { ContactInput, ContactUpdateInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";

type UseContactActionsInput = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

export type ContactsCsvImportActionResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "imported"; summary: ContactsCsvImportSummary }
  | { kind: "failed" }
>;

export type ContactsCsvExportActionResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; contactCount: number; savedFileName: string }
  | { kind: "failed" }
>;

/**
 * - Purpose: bind contact CRUD, call, and CSV import/export actions to facade Use Cases.
 * - Inputs: account bootstrap facade and optional notification callback.
 * - Outputs: load and mutation callbacks for contacts shell wiring.
 */
export function useContactActions({ facade, notify }: UseContactActionsInput) {
  const setContactsLoading = useAccountBootstrapStore((state) => state.setContactsLoading);
  const setContactsLoaded = useAccountBootstrapStore((state) => state.setContactsLoaded);
  const setContactsLoadError = useAccountBootstrapStore((state) => state.setContactsLoadError);

  const loadContacts = useCallback(async (): Promise<void> => {
    setContactsLoading();
    const result = await facade.listContacts();
    if (isErr(result)) {
      setContactsLoadError("contacts.error.loadFailed");
      return;
    }
    setContactsLoaded(result.value);
  }, [facade, setContactsLoadError, setContactsLoaded, setContactsLoading]);

  const getContact = useCallback(
    async (contactId: string) => facade.getContact(contactId),
    [facade],
  );

  const createContact = useCallback(
    async (contact: ContactInput) => facade.createContact(contact),
    [facade],
  );

  const updateContact = useCallback(
    async (contactId: string, update: ContactUpdateInput) =>
      facade.updateContact(contactId, update),
    [facade],
  );

  const deleteContact = useCallback(
    async (contactId: string) => facade.deleteContact(contactId),
    [facade],
  );

  const callContact = useCallback(
    async (contactId: string) => facade.callContact(contactId),
    [facade],
  );

  const importContactsCsv = useCallback(async (): Promise<ContactsCsvImportActionResult> => {
    const result = await facade.importContactsFromCsv();
    if (isErr(result)) {
      notify?.({
        level: "error",
        messageKey: "contacts.csv.error.importFailed",
      });
      return { kind: "failed" };
    }

    if (result.value.kind === "cancelled") {
      return { kind: "cancelled" };
    }

    if (result.value.summary.createdCount > 0) {
      await loadContacts();
    }

    if (
      result.value.summary.failedRows.length === 0 &&
      result.value.summary.skippedDuplicateCount === 0
    ) {
      notify?.({
        level: "success",
        messageKey: "contacts.csv.success.imported",
        messageParams: { count: result.value.summary.createdCount },
      });
    }

    return {
      kind: "imported",
      summary: result.value.summary,
    };
  }, [facade, loadContacts, notify]);

  const exportContactsCsv = useCallback(async (): Promise<ContactsCsvExportActionResult> => {
    try {
      const result = await facade.exportContactsToCsv();
      if (isErr(result)) {
        notify?.({
          level: "error",
          messageKey: "contacts.csv.error.exportFailed",
        });
        return { kind: "failed" };
      }

      if (result.value.kind === "cancelled") {
        notify?.({
          level: "info",
          messageKey: "contacts.csv.info.exportCancelled",
        });
        return { kind: "cancelled" };
      }

      notify?.({
        level: "success",
        messageKey: "contacts.csv.success.exported",
        messageParams: {
          count: result.value.contactCount,
          fileName: result.value.savedFileName,
        },
      });
      return {
        kind: "exported",
        contactCount: result.value.contactCount,
        savedFileName: result.value.savedFileName,
      };
    } catch {
      notify?.({
        level: "error",
        messageKey: "contacts.csv.error.exportFailed",
      });
      return { kind: "failed" };
    }
  }, [facade, notify]);

  return useMemo(
    () => ({
      loadContacts,
      getContact,
      createContact,
      updateContact,
      deleteContact,
      callContact,
      importContactsCsv,
      exportContactsCsv,
    }),
    [
      loadContacts,
      getContact,
      createContact,
      updateContact,
      deleteContact,
      callContact,
      importContactsCsv,
      exportContactsCsv,
    ],
  );
}

export type UseContactActionsResult = ReturnType<typeof useContactActions>;
