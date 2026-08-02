import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContactInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import {
  extractContactValidationErrors,
  mapContactValidationErrorsByField,
  type ContactFieldErrorKey,
} from "../helpers/mapContactValidationErrors.js";
import { useI18n } from "../i18n/index.js";
import type { UseContactActionsResult } from "./useContactActions.js";
import { useShellRouteDataStore } from "../navigation/routeData/useShellRouteDataStore.js";
import type { ContactRouteSnapshot } from "../navigation/routeData/shellRouteDataModel.js";

export const NEW_CONTACT_ROUTE_ID = "new";

export type ContactFormValues = Readonly<{
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string;
  company: string;
  notes: string;
}>;

export type ContactFormFieldErrors = Readonly<
  Partial<Record<keyof ContactFormValues, string>>
>;

type UseContactEditShellInput = Readonly<{
  contactId: string;
  routeNotFound: boolean;
  actions: UseContactActionsResult;
}>;

export type UseContactEditShellResult = Readonly<{
  isCreateMode: boolean;
  isLoading: boolean;
  isNotFound: boolean;
  isSaving: boolean;
  values: ContactFormValues;
  fieldErrors: ContactFormFieldErrors;
  onFieldChange: (field: keyof ContactFormValues, value: string) => void;
  onSubmit: () => Promise<string | null>;
}>;

const EMPTY_FORM: ContactFormValues = {
  displayName: "",
  primaryPhone: "",
  secondaryPhone: "",
  company: "",
  notes: "",
};

/**
 * - Purpose: manage contact create/edit form state and facade mutations.
 * - Inputs: contact id, route not-found flag, and mutation actions.
 * - Outputs: form values, validation errors, and save callback returning saved id.
 */
export function useContactEditShell({
  contactId,
  routeNotFound,
  actions,
}: UseContactEditShellInput): UseContactEditShellResult {
  const { t } = useI18n();
  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);
  const activeContact = useShellRouteDataStore((state) => state.activeContact);
  const contactCreatePrefill = useShellRouteDataStore((state) => state.contactCreatePrefill);
  const isCreateMode = contactId === NEW_CONTACT_ROUTE_ID;
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [isNotFound, setIsNotFound] = useState(routeNotFound);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<ContactFormValues>(EMPTY_FORM);
  const [fieldErrorKeys, setFieldErrorKeys] = useState<
    Partial<Record<keyof ContactFormValues, ContactFieldErrorKey>>
  >({});
  const initializedRouteKeyRef = useRef<string | null>(null);

  const routeLoadState = useMemo(
    () =>
      resolveEditRouteLoadState({
        contactId,
        routeNotFound,
        isCreateMode,
        contactCreatePrefill,
        activeContact,
        projectionContact:
          contactsProjection.contacts.find((entry) => entry.id === contactId) ?? null,
      }),
    [
      activeContact,
      contactCreatePrefill,
      contactId,
      contactsProjection.contacts,
      isCreateMode,
      routeNotFound,
    ],
  );

  useEffect(() => {
    const routeKey = `${contactId}:${routeLoadState.initToken}`;
    if (initializedRouteKeyRef.current === routeKey) {
      return;
    }

    initializedRouteKeyRef.current = routeKey;
    setFieldErrorKeys({});
    setIsLoading(routeLoadState.isLoading);
    setIsNotFound(routeLoadState.isNotFound);
    setValues(routeLoadState.initialValues);
  }, [contactId, routeLoadState]);

  const onFieldChange = useCallback((field: keyof ContactFormValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrorKeys((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const createContact = actions.createContact;
  const updateContact = actions.updateContact;

  const onSubmit = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    setFieldErrorKeys({});

    const payload = toContactInput(values);
    const result = isCreateMode
      ? await createContact(payload)
      : await updateContact(contactId, toContactUpdateInput(values));

    setIsSaving(false);

    if (isErr(result)) {
      if (result.error.code === "validation_failed") {
        const mapped = mapContactValidationErrorsByField(
          extractContactValidationErrors(result.error.cause),
        );
        setFieldErrorKeys(mapped);
      }
      return null;
    }

    return result.value.id;
  }, [contactId, createContact, isCreateMode, updateContact, values]);

  const fieldErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fieldErrorKeys).map(([field, key]) => [field, t(key)]),
      ) as ContactFormFieldErrors,
    [fieldErrorKeys, t],
  );

  return {
    isCreateMode,
    isLoading,
    isNotFound,
    isSaving,
    values,
    fieldErrors,
    onFieldChange,
    onSubmit,
  };
}

function resolveEditRouteLoadState(input: Readonly<{
  contactId: string;
  routeNotFound: boolean;
  isCreateMode: boolean;
  contactCreatePrefill: ReturnType<typeof useShellRouteDataStore.getState>["contactCreatePrefill"];
  activeContact: ReturnType<typeof useShellRouteDataStore.getState>["activeContact"];
  projectionContact: Readonly<{
    displayName: string;
    primaryPhone: string;
    secondaryPhone: string | null;
    company: string | null;
    notes: string | null;
  }> | null;
}>): Readonly<{
  initToken: string;
  isLoading: boolean;
  isNotFound: boolean;
  initialValues: ContactFormValues;
}> {
  if (input.routeNotFound) {
    return {
      initToken: "not-found",
      isLoading: false,
      isNotFound: true,
      initialValues: EMPTY_FORM,
    };
  }

  if (input.isCreateMode) {
    const initialValues =
      input.contactCreatePrefill === null
        ? EMPTY_FORM
        : {
            ...EMPTY_FORM,
            displayName: input.contactCreatePrefill.displayName,
            primaryPhone: input.contactCreatePrefill.primaryPhone,
          };

    return {
      initToken: `create:${initialValues.displayName}:${initialValues.primaryPhone}`,
      isLoading: false,
      isNotFound: false,
      initialValues,
    };
  }

  if (input.activeContact === null || input.activeContact.contactId !== input.contactId) {
    return {
      initToken: "pending",
      isLoading: true,
      isNotFound: false,
      initialValues: EMPTY_FORM,
    };
  }

  if (input.activeContact.status === "loading") {
    return {
      initToken: `loading:${input.activeContact.activeToken}`,
      isLoading: true,
      isNotFound: false,
      initialValues: EMPTY_FORM,
    };
  }

  if (input.activeContact.status === "notFound") {
    return {
      initToken: `not-found:${input.activeContact.activeToken}`,
      isLoading: false,
      isNotFound: true,
      initialValues: EMPTY_FORM,
    };
  }

  if (input.activeContact.status === "failed") {
    return {
      initToken: `failed:${input.activeContact.activeToken}`,
      isLoading: false,
      isNotFound: false,
      initialValues: EMPTY_FORM,
    };
  }

  if (input.projectionContact !== null) {
    return {
      initToken: `loaded:${input.activeContact.activeToken}:projection`,
      isLoading: false,
      isNotFound: false,
      initialValues: mapProjectionToForm(input.projectionContact),
    };
  }

  if (input.activeContact.snapshot !== null) {
    return {
      initToken: `loaded:${input.activeContact.activeToken}:snapshot`,
      isLoading: false,
      isNotFound: false,
      initialValues: mapSnapshotToForm(input.activeContact.snapshot),
    };
  }

  return {
    initToken: `loaded:${input.activeContact.activeToken}:empty`,
    isLoading: false,
    isNotFound: false,
    initialValues: EMPTY_FORM,
  };
}

function mapProjectionToForm(contact: Readonly<{
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
}>): ContactFormValues {
  return {
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone ?? "",
    company: contact.company ?? "",
    notes: contact.notes ?? "",
  };
}

function mapSnapshotToForm(snapshot: ContactRouteSnapshot): ContactFormValues {
  return mapProjectionToForm(snapshot);
}

function toContactInput(values: ContactFormValues): ContactInput {
  return {
    displayName: values.displayName,
    primaryPhone: values.primaryPhone,
    secondaryPhone: values.secondaryPhone,
    company: values.company,
    notes: values.notes,
  };
}

function toContactUpdateInput(values: ContactFormValues): Readonly<{
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
}> {
  return {
    displayName: values.displayName,
    primaryPhone: values.primaryPhone,
    secondaryPhone: values.secondaryPhone.trim().length > 0 ? values.secondaryPhone : null,
    company: values.company.trim().length > 0 ? values.company : null,
    notes: values.notes.trim().length > 0 ? values.notes : null,
  };
}
