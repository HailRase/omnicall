import {
  V1_DEFERRED_CAMPAIGN_EVENTS,
  V1_PRODUCT_UNAVAILABLE_COMMANDS
} from './constants.js';
import type { CommandType } from './commands.js';

/**
 * Whether a command type is available on the v1 product surface.
 * `window:hide` remains schema-valid for future use but must be denied in v1
 * (ADR-0013) with `forbidden` / `unsupported_command` per gateway policy.
 * @public
 */
export function isCommandAvailableInProductV1(type: CommandType): boolean {
  return !(V1_PRODUCT_UNAVAILABLE_COMMANDS as readonly string[]).includes(type);
}

/**
 * Stable product denial code for v1-unavailable commands.
 * @public
 */
export function productDenialCodeForCommand(
  type: CommandType
): 'forbidden' | null {
  if (!isCommandAvailableInProductV1(type)) {
    return 'forbidden';
  }
  return null;
}

/**
 * Historical helper (ADR-0017 deferral). After ADR-0019 the deferred list is empty,
 * so this always returns false for current protocol majors.
 * @public
 */
export function isDeferredCampaignEventType(type: string): boolean {
  return (V1_DEFERRED_CAMPAIGN_EVENTS as readonly string[]).includes(type);
}
