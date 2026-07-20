/**
 * Map desktop registration projection → public SDK registration vocabulary.
 */

import type { RegistrationState } from "@domain/index.js";

export type SdkPublicRegistrationState =
  | "registered"
  | "unregistering"
  | "unregistered"
  | "failed";

export function mapSdkRegistrationState(
  state: RegistrationState,
): SdkPublicRegistrationState {
  switch (state) {
    case "registered":
      return "registered";
    case "failed":
      return "failed";
    case "registering":
    case "idle":
      return "unregistered";
    default:
      return "unregistered";
  }
}
