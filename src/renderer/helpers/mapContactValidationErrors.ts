export type ContactValidationErrorCode =
  | "display_name_required"
  | "display_name_too_long"
  | "primary_phone_invalid"
  | "secondary_phone_invalid"
  | "company_too_long"
  | "notes_too_long";

export type ContactFieldErrorKey =
  | "contacts.field.error.displayNameRequired"
  | "contacts.field.error.displayNameTooLong"
  | "contacts.field.error.primaryPhoneInvalid"
  | "contacts.field.error.secondaryPhoneInvalid"
  | "contacts.field.error.companyTooLong"
  | "contacts.field.error.notesTooLong";

const CONTACT_VALIDATION_ERRORS: ReadonlyArray<ContactValidationErrorCode> = [
  "display_name_required",
  "display_name_too_long",
  "primary_phone_invalid",
  "secondary_phone_invalid",
  "company_too_long",
  "notes_too_long",
];

const FIELD_ERROR_BY_CODE: Record<ContactValidationErrorCode, ContactFieldErrorKey> = {
  display_name_required: "contacts.field.error.displayNameRequired",
  display_name_too_long: "contacts.field.error.displayNameTooLong",
  primary_phone_invalid: "contacts.field.error.primaryPhoneInvalid",
  secondary_phone_invalid: "contacts.field.error.secondaryPhoneInvalid",
  company_too_long: "contacts.field.error.companyTooLong",
  notes_too_long: "contacts.field.error.notesTooLong",
};

const FIELD_NAME_BY_CODE: Record<
  ContactValidationErrorCode,
  "displayName" | "primaryPhone" | "secondaryPhone" | "company" | "notes"
> = {
  display_name_required: "displayName",
  display_name_too_long: "displayName",
  primary_phone_invalid: "primaryPhone",
  secondary_phone_invalid: "secondaryPhone",
  company_too_long: "company",
  notes_too_long: "notes",
};

/**
 * - Purpose: map domain contact validation codes to renderer i18n keys.
 * - Inputs: contact validation error code from Use Case failure cause.
 * - Outputs: translation key for field-level form errors.
 */
export function mapContactValidationError(code: ContactValidationErrorCode): ContactFieldErrorKey {
  return FIELD_ERROR_BY_CODE[code];
}

/**
 * - Purpose: extract contact validation codes from platform error cause payloads.
 * - Inputs: unknown error cause from facade Result.
 * - Outputs: typed validation error codes for form field mapping.
 */
export function extractContactValidationErrors(cause: unknown): ReadonlyArray<ContactValidationErrorCode> {
  if (!Array.isArray(cause)) {
    return [];
  }

  return cause.filter(isContactValidationErrorCode);
}

/**
 * - Purpose: group validation codes by contact form field for inline errors.
 * - Inputs: validation error codes from failed create/update.
 * - Outputs: first error key per form field name.
 */
export function mapContactValidationErrorsByField(
  codes: ReadonlyArray<ContactValidationErrorCode>,
): Readonly<Partial<Record<"displayName" | "primaryPhone" | "secondaryPhone" | "company" | "notes", ContactFieldErrorKey>>> {
  const result: Partial<
    Record<"displayName" | "primaryPhone" | "secondaryPhone" | "company" | "notes", ContactFieldErrorKey>
  > = {};

  for (const code of codes) {
    const field = FIELD_NAME_BY_CODE[code];
    if (result[field] === undefined) {
      result[field] = mapContactValidationError(code);
    }
  }

  return result;
}

function isContactValidationErrorCode(value: unknown): value is ContactValidationErrorCode {
  return (
    typeof value === "string" &&
    CONTACT_VALIDATION_ERRORS.includes(value as ContactValidationErrorCode)
  );
}
