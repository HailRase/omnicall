/**
 * - Purpose: represent a stable call identifier.
 * - Inputs: non-empty id string.
 * - Outputs: branded CallId value.
 */
export type CallId = string & { readonly __brand: "CallId" };

export function createCallId(value: string): CallId {
  return value as CallId;
}

