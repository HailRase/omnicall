import { normalizePhoneNumber, validatePhoneNumber } from "../telephony/PhoneNumber.js";
import { generateContactId, type ContactId } from "./ContactId.js";

export type Contact = Readonly<{
  id: ContactId;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type ContactInput = Readonly<{
  displayName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  company?: string;
  notes?: string;
}>;

export type ContactUpdateInput = Readonly<{
  displayName?: string;
  primaryPhone?: string;
  secondaryPhone?: string | null;
  company?: string | null;
  notes?: string | null;
}>;

export type ContactValidationError =
  | "display_name_required"
  | "display_name_too_long"
  | "primary_phone_invalid"
  | "secondary_phone_invalid"
  | "company_too_long"
  | "notes_too_long";

export type CreateContactResult =
  | Readonly<{ ok: true; value: Contact }>
  | Readonly<{ ok: false; errors: ReadonlyArray<ContactValidationError> }>;

export type UpdateContactResult =
  | Readonly<{ ok: true; value: Contact }>
  | Readonly<{ ok: false; errors: ReadonlyArray<ContactValidationError> }>;

const MAX_DISPLAY_NAME_LENGTH = 128;
const MAX_COMPANY_LENGTH = 128;
const MAX_NOTES_LENGTH = 512;

/**
 * - Purpose: validate and build a new local contact record.
 * - Inputs: contact input fields and optional id/timestamps.
 * - Outputs: Contact value or validation errors.
 */
export function createContact(
  input: ContactInput,
  options?: Readonly<{
    id?: ContactId;
    createdAt?: string;
    updatedAt?: string;
  }>,
): CreateContactResult {
  const validationErrors = validateContactFields(input);
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors };
  }

  const normalized = normalizeContactFields(input);
  const timestamp = options?.updatedAt ?? options?.createdAt ?? new Date().toISOString();

  return {
    ok: true,
    value: {
      id: options?.id ?? generateContactId(),
      displayName: normalized.displayName,
      primaryPhone: normalized.primaryPhone,
      secondaryPhone: normalized.secondaryPhone,
      company: normalized.company,
      notes: normalized.notes,
      createdAt: options?.createdAt ?? timestamp,
      updatedAt: options?.updatedAt ?? timestamp,
    },
  };
}

/**
 * - Purpose: apply partial updates to an existing contact.
 * - Inputs: current contact and update input fields.
 * - Outputs: updated Contact or validation errors.
 */
export function updateContact(
  existing: Contact,
  input: ContactUpdateInput,
  updatedAt: string = new Date().toISOString(),
): UpdateContactResult {
  const merged: ContactInput = {
    displayName: input.displayName ?? existing.displayName,
    primaryPhone: input.primaryPhone ?? existing.primaryPhone,
    secondaryPhone:
      input.secondaryPhone === null
        ? ""
        : input.secondaryPhone ?? existing.secondaryPhone ?? "",
    company: input.company === null ? "" : input.company ?? existing.company ?? "",
    notes: input.notes === null ? "" : input.notes ?? existing.notes ?? "",
  };

  const validationErrors = validateContactFields(merged);
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors };
  }

  const normalized = normalizeContactFields(merged);

  return {
    ok: true,
    value: {
      ...existing,
      displayName: normalized.displayName,
      primaryPhone: normalized.primaryPhone,
      secondaryPhone: normalized.secondaryPhone,
      company: normalized.company,
      notes: normalized.notes,
      updatedAt,
    },
  };
}

function validateContactFields(input: ContactInput): ReadonlyArray<ContactValidationError> {
  const errors: ContactValidationError[] = [];
  const displayName = input.displayName.trim();

  if (displayName.length === 0) {
    errors.push("display_name_required");
  } else if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.push("display_name_too_long");
  }

  errors.push(...mapPhoneValidationErrors(validatePhoneNumber(input.primaryPhone), "primary"));

  const secondaryPhone = input.secondaryPhone?.trim() ?? "";
  if (secondaryPhone.length > 0) {
    errors.push(...mapPhoneValidationErrors(validatePhoneNumber(secondaryPhone), "secondary"));
  }

  const company = input.company?.trim() ?? "";
  if (company.length > MAX_COMPANY_LENGTH) {
    errors.push("company_too_long");
  }

  const notes = input.notes?.trim() ?? "";
  if (notes.length > MAX_NOTES_LENGTH) {
    errors.push("notes_too_long");
  }

  return errors;
}

function mapPhoneValidationErrors(
  phoneErrors: ReturnType<typeof validatePhoneNumber>,
  field: "primary" | "secondary",
): ReadonlyArray<ContactValidationError> {
  if (phoneErrors.length === 0) {
    return [];
  }
  return field === "primary" ? ["primary_phone_invalid"] : ["secondary_phone_invalid"];
}

function normalizeContactFields(input: ContactInput): Readonly<{
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
}> {
  const secondaryPhone = input.secondaryPhone?.trim() ?? "";
  const company = input.company?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  return {
    displayName: input.displayName.trim(),
    primaryPhone: normalizePhoneNumber(input.primaryPhone),
    secondaryPhone: secondaryPhone.length > 0 ? normalizePhoneNumber(secondaryPhone) : null,
    company: company.length > 0 ? company : null,
    notes: notes.length > 0 ? notes : null,
  };
}
