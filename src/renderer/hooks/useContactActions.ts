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
    async (contact: ContactInput) => {
      const result = await facade.createContact(contact);
      if (isErr(result)) {
        if (result.error.code !== "validation_failed") {
          notify?.({
            level: "error",
            messageKey: "contacts.error.saveFailed",
            module: "contacts",
            functionId: "contacts.create",
            interruptClass: "actionable",
          });
        }
        return result;
      }
      notify?.({
        level: "success",
        messageKey: "contacts.success.created",
        module: "contacts",
        functionId: "contacts.create",
        interruptClass: "informational",
      });
      return result;
    },
    [facade, notify],
  );

  const updateContact = useCallback(
    async (contactId: string, update: ContactUpdateInput) => {
      const result = await facade.updateContact(contactId, update);
      if (isErr(result)) {
        if (result.error.code !== "validation_failed") {
          notify?.({
            level: "error",
            messageKey: "contacts.error.saveFailed",
            module: "contacts",
            functionId: "contacts.update",
            interruptClass: "actionable",
          });
        }
        return result;
      }
      notify?.({
        level: "success",
        messageKey: "contacts.success.updated",
        module: "contacts",
        functionId: "contacts.update",
        interruptClass: "informational",
      });
      return result;
    },
    [facade, notify],
  );

  const deleteContact = useCallback(
    async (contactId: string) => {
      const result = await facade.deleteContact(contactId);
      if (isErr(result)) {
        notify?.({
          level: "error",
          messageKey: "contacts.error.deleteFailed",
          module: "contacts",
          functionId: "contacts.delete",
          interruptClass: "actionable",
        });
      }
      return result;
    },
    [facade, notify],
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
        module: "contacts",
        functionId: "contacts.csv.import",
        interruptClass: "actionable",
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
        module: "contacts",
        functionId: "contacts.csv.import",
        interruptClass: "informational",
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
          module: "contacts",
          functionId: "contacts.csv.export",
          interruptClass: "actionable",
        });
        return { kind: "failed" };
      }

      if (result.value.kind === "cancelled") {
        notify?.({
          level: "info",
          messageKey: "contacts.csv.info.exportCancelled",
          module: "contacts",
          functionId: "contacts.csv.export",
          interruptClass: "informational",
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
        module: "contacts",
        functionId: "contacts.csv.export",
        interruptClass: "informational",
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
        module: "contacts",
        functionId: "contacts.csv.export",
        interruptClass: "actionable",
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
