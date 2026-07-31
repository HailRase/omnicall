/**
 * - Purpose: branded UUID identifiers for External Applications records.
 * - Inputs: UUID strings from trusted domain construction.
 * - Outputs: branded application identifier type and UUID guard.
 */

export type ExternalApplicationId = string & {
  readonly __brand: "ExternalApplicationId";
};

const RFC_4122_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isExternalApplicationUuid(value: string): boolean {
  return RFC_4122_UUID_PATTERN.test(value);
}
