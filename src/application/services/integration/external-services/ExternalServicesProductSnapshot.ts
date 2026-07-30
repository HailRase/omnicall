/**
 * - Purpose: define the typed Application snapshot for External Services triggers.
 * - Inputs: active profile settings and focus facts after store commit.
 * - Outputs: immutable evaluation input for the automation service.
 */

import type {
  SettingsAccountKey,
} from "@domain/index.js";

export type ExternalServicesProductSnapshot = Readonly<{
  profileKey: SettingsAccountKey;
  focusedCallId: string | null;
  userLogin?: string;
}>;
