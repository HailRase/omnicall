import type { Contact, ContactInput } from "@domain/index.js";

export const CONTACT_CSV_CANONICAL_HEADER =
  "displayName,primaryPhone,secondaryPhone,company,notes" as const;

const CANONICAL_COLUMNS = [
  "displayName",
  "primaryPhone",
  "secondaryPhone",
  "company",
  "notes",
] as const;

export type ContactCsvColumn = (typeof CANONICAL_COLUMNS)[number];

export type ContactCsvRow = Readonly<{
  rowNumber: number;
  values: Readonly<Record<ContactCsvColumn, string>>;
}>;

export type ParsedContactCsvDocument = Readonly<{
  rows: ReadonlyArray<ContactCsvRow>;
}>;

export type ContactCsvParseFailureReason =
  | "empty_document"
  | "missing_header"
  | "invalid_header"
  | "unsafe_row_structure";

export type ContactCsvParseFailure = Readonly<{
  reason: ContactCsvParseFailureReason;
}>;

export type ContactCsvParseResult =
  | Readonly<{ ok: true; value: ParsedContactCsvDocument }>
  | Readonly<{ ok: false; error: ContactCsvParseFailure }>;

/**
 * - Purpose: parse untrusted contacts CSV into row values for import validation.
 * - Inputs: UTF-8 CSV text with canonical header row.
 * - Outputs: parsed rows or a structural parse failure without partial mutation.
 */
export function parseContactsCsv(contents: string): ContactCsvParseResult {
  const normalizedContents = stripUtf8Bom(contents);
  if (normalizedContents.trim().length === 0) {
    return { ok: false, error: { reason: "empty_document" } };
  }

  const parsedRows = parseCsvRecords(normalizedContents);
  if (parsedRows === null) {
    return { ok: false, error: { reason: "unsafe_row_structure" } };
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: { reason: "empty_document" } };
  }

  const headerRow = parsedRows[0];
  if (headerRow === undefined) {
    return { ok: false, error: { reason: "missing_header" } };
  }

  const columnIndexes = resolveCanonicalColumnIndexes(headerRow);
  if (columnIndexes === null) {
    return { ok: false, error: { reason: "invalid_header" } };
  }

  const rows: ContactCsvRow[] = [];
  for (let index = 1; index < parsedRows.length; index += 1) {
    const record = parsedRows[index];
    if (record === undefined) {
      continue;
    }

    if (isBlankCsvRecord(record)) {
      continue;
    }

    rows.push({
      rowNumber: index + 1,
      values: {
        displayName: readCsvField(record, columnIndexes.displayName),
        primaryPhone: readCsvField(record, columnIndexes.primaryPhone),
        secondaryPhone: readCsvField(record, columnIndexes.secondaryPhone),
        company: readCsvField(record, columnIndexes.company),
        notes: readCsvField(record, columnIndexes.notes),
      },
    });
  }

  return {
    ok: true,
    value: { rows },
  };
}

/**
 * - Purpose: serialize current account contacts into canonical CSV export text.
 * - Inputs: persisted Contact records for the active account.
 * - Outputs: UTF-8 CSV string with canonical header and RFC-4180 escaping.
 */
export function serializeContactsCsv(contacts: ReadonlyArray<Contact>): string {
  const lines: string[] = [CONTACT_CSV_CANONICAL_HEADER];
  for (const contact of contacts) {
    lines.push(
      [
        contact.displayName,
        contact.primaryPhone,
        contact.secondaryPhone ?? "",
        contact.company ?? "",
        contact.notes ?? "",
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

/**
 * - Purpose: map parsed CSV row values into contact creation input.
 * - Inputs: parsed CSV row values.
 * - Outputs: ContactInput with optional fields omitted when blank.
 */
export function mapContactCsvRowToInput(
  row: ContactCsvRow["values"],
): ContactInput {
  const secondaryPhone = row.secondaryPhone.trim();
  const company = row.company.trim();
  const notes = row.notes.trim();

  return {
    displayName: row.displayName.trim(),
    primaryPhone: row.primaryPhone.trim(),
    ...(secondaryPhone.length > 0 ? { secondaryPhone } : {}),
    ...(company.length > 0 ? { company } : {}),
    ...(notes.length > 0 ? { notes } : {}),
  };
}

function stripUtf8Bom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function resolveCanonicalColumnIndexes(
  headerRow: ReadonlyArray<string>,
): Readonly<Record<ContactCsvColumn, number>> | null {
  const normalizedHeader = headerRow.map((value) => value.trim().toLowerCase());
  const indexes: Partial<Record<ContactCsvColumn, number>> = {};

  for (const column of CANONICAL_COLUMNS) {
    const index = normalizedHeader.indexOf(column.toLowerCase());
    if (index < 0) {
      return null;
    }
    indexes[column] = index;
  }

  return indexes as Record<ContactCsvColumn, number>;
}

function readCsvField(record: ReadonlyArray<string>, index: number): string {
  return record[index]?.trim() ?? "";
}

function isBlankCsvRecord(record: ReadonlyArray<string>): boolean {
  return record.every((value) => value.trim().length === 0);
}

function escapeCsvField(value: string): string {
  const mustQuote =
    value.includes(",") || value.includes("\"") || value.includes("\n") || value.includes("\r");
  if (!mustQuote) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function parseCsvRecords(contents: string): ReadonlyArray<ReadonlyArray<string>> | null {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    if (character === undefined) {
      return null;
    }

    if (inQuotes) {
      if (character === "\"") {
        const nextCharacter = contents[index + 1];
        if (nextCharacter === "\"") {
          currentField += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += character;
      }
      continue;
    }

    if (character === "\"") {
      inQuotes = true;
      continue;
    }

    if (character === ",") {
      currentRecord.push(currentField);
      currentField = "";
      continue;
    }

    if (character === "\n") {
      currentRecord.push(currentField);
      records.push(currentRecord);
      currentRecord = [];
      currentField = "";
      continue;
    }

    if (character === "\r") {
      const nextCharacter = contents[index + 1];
      if (nextCharacter === "\n") {
        index += 1;
      }
      currentRecord.push(currentField);
      records.push(currentRecord);
      currentRecord = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  if (inQuotes) {
    return null;
  }

  currentRecord.push(currentField);
  records.push(currentRecord);
  return records;
}
