import { useCallback, useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ContactInput, ContactUpdateInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type UseContactActionsInput = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: bind contact CRUD and call actions to facade Use Cases.
 * - Inputs: account bootstrap facade.
 * - Outputs: load and mutation callbacks for contacts shell wiring.
 */
export function useContactActions({ facade }: UseContactActionsInput) {
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

  return useMemo(
    () => ({
      loadContacts,
      getContact,
      createContact,
      updateContact,
      deleteContact,
      callContact,
    }),
    [
      loadContacts,
      getContact,
      createContact,
      updateContact,
      deleteContact,
      callContact,
    ],
  );
}

export type UseContactActionsResult = ReturnType<typeof useContactActions>;
