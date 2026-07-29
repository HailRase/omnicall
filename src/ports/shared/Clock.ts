/**
 * - Purpose: provide deterministic current time to External Services application logic.
 * - Inputs: current time requested by a consumer.
 * - Outputs: an immutable timestamp snapshot.
 */
export interface Clock {
  now(): Date;
}
