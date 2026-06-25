import type { MultiCallSettings } from "../telephony/MultiCallPolicy.js";
import type { UserSettings } from "./UserSettings.js";

/**
 * - Purpose: map UserSettings aggregate slices for legacy port getters.
 * - Inputs: UserSettings v1 aggregate.
 * - Outputs: multi-call or auto-answer projection slices.
 */
export function toMultiCallSettings(settings: UserSettings): MultiCallSettings {
  return {
    multiSessionsEnabled: settings.multiSessionsEnabled,
    autoUnholdOnTransferFailure: settings.autoUnholdOnTransferFailure,
  };
}

export function toAutoAnswerTimeoutSec(settings: UserSettings): number | null {
  return settings.autoAnswerTimeoutSec;
}

export function mergeMultiCallIntoUserSettings(
  base: UserSettings,
  multiCall: MultiCallSettings,
): UserSettings {
  return {
    ...base,
    multiSessionsEnabled: multiCall.multiSessionsEnabled,
    autoUnholdOnTransferFailure: multiCall.autoUnholdOnTransferFailure !== false,
  };
}
