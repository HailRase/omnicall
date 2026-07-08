import type { Contact, ContactValidationError } from "@domain/index.js";
import { createContact, normalizePhoneNumber } from "@domain/index.js";
import type { ContactRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  mapContactCsvRowToInput,
  parseContactsCsv,
  type ContactCsvParseFailureReason,
} from "../../import-export/ContactCsvCodec.js";
import { CreateContactUseCase } from "./CreateContactUseCase.js";

export type ContactsCsvImportFailedRow = Readonly<{
  rowNumber: number;
  errors: ReadonlyArray<ContactValidationError>;
}>;

export type ContactsCsvImportSummary = Readonly<{
  createdCount: number;
  skippedDuplicateCount: number;
  failedRows: ReadonlyArray<ContactsCsvImportFailedRow>;
}>;

export type ImportContactsCsvInput = Readonly<{
  csvContents: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: import contacts from validated CSV rows for the active account profile.
 * - Inputs: UTF-8 CSV text and optional correlation id.
 * - Outputs: per-row summary with created, skipped duplicate, and failed counts.
 */
export class ImportContactsCsvUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly createContactUseCase: CreateContactUseCase,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ImportContactsCsvInput,
  ): Promise<Result<ContactsCsvImportSummary, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const parsed = parseContactsCsv(input.csvContents);
    if (!parsed.ok) {
      return err(
        createPlatformError(
          "validation_failed",
          "Invalid contacts CSV document",
          [mapParseFailureReason(parsed.error.reason)],
        ),
      );
    }

    const existingContacts = await this.contactRepository.listContacts();
    const reservedPhones = buildReservedPhoneIndex(existingContacts);
    const summary: {
      createdCount: number;
      skippedDuplicateCount: number;
      failedRows: ContactsCsvImportFailedRow[];
    } = {
      createdCount: 0,
      skippedDuplicateCount: 0,
      failedRows: [],
    };

    for (const row of parsed.value.rows) {
      const contactInput = mapContactCsvRowToInput(row.values);
      const validation = createContact(contactInput);
      if (!validation.ok) {
        summary.failedRows.push({
          rowNumber: row.rowNumber,
          errors: validation.errors,
        });
        continue;
      }

      if (hasReservedPhoneConflict(validation.value, reservedPhones)) {
        summary.skippedDuplicateCount += 1;
        continue;
      }

      const created = await this.createContactUseCase.execute({
        contact: contactInput,
        correlationId,
      });
      if (!created.ok) {
        summary.failedRows.push({
          rowNumber: row.rowNumber,
          errors: extractValidationErrors(created.error),
        });
        continue;
      }

      reserveContactPhones(created.value, reservedPhones);
      summary.createdCount += 1;
    }

    this.logger.info("contacts_csv_import_completed", {
      correlationId,
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "import_contacts_csv",
      createdCount: summary.createdCount,
      skippedDuplicateCount: summary.skippedDuplicateCount,
      failedCount: summary.failedRows.length,
      result: "succeeded",
    });

    return ok({
      createdCount: summary.createdCount,
      skippedDuplicateCount: summary.skippedDuplicateCount,
      failedRows: summary.failedRows,
    });
  }
}

function buildReservedPhoneIndex(contacts: ReadonlyArray<Contact>): Set<string> {
  const reserved = new Set<string>();
  for (const contact of contacts) {
    reserveContactPhones(contact, reserved);
  }
  return reserved;
}

function reserveContactPhones(
  contact: Readonly<{ primaryPhone: string; secondaryPhone: string | null }>,
  reservedPhones: Set<string>,
): void {
  reservedPhones.add(normalizePhoneNumber(contact.primaryPhone));
  if (contact.secondaryPhone !== null) {
    reservedPhones.add(normalizePhoneNumber(contact.secondaryPhone));
  }
}

function hasReservedPhoneConflict(
  contact: Readonly<{ primaryPhone: string; secondaryPhone: string | null }>,
  reservedPhones: Set<string>,
): boolean {
  const primary = normalizePhoneNumber(contact.primaryPhone);
  if (reservedPhones.has(primary)) {
    return true;
  }

  if (contact.secondaryPhone === null) {
    return false;
  }

  const secondary = normalizePhoneNumber(contact.secondaryPhone);
  return reservedPhones.has(secondary) || secondary === primary;
}

function extractValidationErrors(error: PlatformError): ReadonlyArray<ContactValidationError> {
  const cause = error.cause;
  if (!Array.isArray(cause)) {
    return ["display_name_required"];
  }

  const validationErrors = cause.filter(
    (value): value is ContactValidationError => typeof value === "string" && isContactValidationError(value),
  );
  if (validationErrors.length > 0) {
    return validationErrors;
  }
  return ["display_name_required"];
}

function isContactValidationError(value: string): value is ContactValidationError {
  return (
    value === "display_name_required" ||
    value === "display_name_too_long" ||
    value === "primary_phone_invalid" ||
    value === "secondary_phone_invalid" ||
    value === "primary_phone_duplicate" ||
    value === "secondary_phone_duplicate" ||
    value === "company_too_long" ||
    value === "notes_too_long"
  );
}

function mapParseFailureReason(reason: ContactCsvParseFailureReason): string {
  switch (reason) {
    case "empty_document":
      return "contacts_csv_empty_document";
    case "missing_header":
      return "contacts_csv_missing_header";
    case "invalid_header":
      return "contacts_csv_invalid_header";
    case "unsafe_row_structure":
      return "contacts_csv_unsafe_structure";
  }
}
