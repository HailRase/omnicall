/**
 * - Purpose: protect sensitive authored HTTP header values before persistence.
 * - Inputs: resolved header rows in authored order.
 * - Outputs: immutable header rows with protected values replaced.
 */
import type { ExternalServiceKeyValue } from "../ExternalServiceHttpDefinition.js";

const PROTECTED_HEADER_NAMES = new Set(["authorization", "cookie", "x-api-key"]);

export function redactExternalServiceHeaders(
  headers: ReadonlyArray<ExternalServiceKeyValue>,
): ReadonlyArray<ExternalServiceKeyValue> {
  return headers.map((header) =>
    isProtectedHeader(header.key) ? { ...header, value: "***" } : { ...header },
  );
}

function isProtectedHeader(key: string): boolean {
  return PROTECTED_HEADER_NAMES.has(key.trim().toLowerCase());
}
