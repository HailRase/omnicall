/**
 * - Purpose: define validated stable identifiers for external service records.
 * - Inputs: UUID strings received from trusted domain construction.
 * - Outputs: branded collection, request, and row identifier types.
 */

export type ExternalServiceCollectionId = string & {
  readonly __brand: "ExternalServiceCollectionId";
};

export type ExternalServiceRequestId = string & {
  readonly __brand: "ExternalServiceRequestId";
};

export type ExternalServiceKeyValueId = string & {
  readonly __brand: "ExternalServiceKeyValueId";
};

const RFC_4122_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isExternalServiceUuid(value: string): boolean {
  return RFC_4122_UUID_PATTERN.test(value);
}
