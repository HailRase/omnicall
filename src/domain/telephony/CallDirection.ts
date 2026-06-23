/**
 * - Purpose: define call direction semantics.
 * - Inputs: direction literal.
 * - Outputs: validated CallDirection value.
 */
export type CallDirection = "incoming" | "outgoing";

export const CALL_DIRECTIONS: ReadonlyArray<CallDirection> = [
  "incoming",
  "outgoing",
];

