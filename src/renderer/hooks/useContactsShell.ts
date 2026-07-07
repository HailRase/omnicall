import { useMemo } from "react";
import { deriveContactsShell } from "@application/projections/deriveContactsShell.js";
import type { ContactShellViewModel } from "@application/projections/deriveContactsShell.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useI18n } from "../i18n/index.js";
import type { Translator } from "../i18n/index.js";

type UseContactsShellInput = Readonly<{
  isSipRegistered: boolean;
}>;

export type ContactListRowViewModel = Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  callDisabledReason: string | null;
}>;

export type UseContactsShellResult = Readonly<{
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  rows: ReadonlyArray<ContactListRowViewModel>;
}>;

/**
 * - Purpose: compose contacts list projection into localized shell rows.
 * - Inputs: registration flag from auth shell projection.
 * - Outputs: localized list rows derived from contacts projection only.
 */
export function useContactsShell({
  isSipRegistered,
}: UseContactsShellInput): UseContactsShellResult {
  const { t } = useI18n();
  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);
  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);

  const shell = useMemo(
    () =>
      deriveContactsShell({
        projection: contactsProjection,
        isSipRegistered,
        multiCallProjection,
      }),
    [contactsProjection, isSipRegistered, multiCallProjection],
  );

  const rows = useMemo(
    () => shell.contacts.map((contact) => mapContactRow(contact, t)),
    [shell.contacts, t],
  );

  return {
    isLoading: shell.status === "loading",
    isEmpty: shell.isEmpty,
    errorMessage: shell.errorKey !== null ? t(shell.errorKey) : null,
    rows,
  };
}

function mapContactRow(
  contact: ContactShellViewModel,
  t: Translator,
): ContactListRowViewModel {
  return {
    id: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    callDisabledReason:
      contact.callDisabledReasonKey !== null ? t(contact.callDisabledReasonKey) : null,
  };
}
