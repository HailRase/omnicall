/**
 * - Purpose: expose External Applications domain configuration contracts.
 * - Inputs: validated settings values and parser requests.
 * - Outputs: stable public domain types, constants, and parser API.
 */

export type { ExternalApplicationId } from "./ExternalApplicationIds.js";
export { isExternalApplicationUuid } from "./ExternalApplicationIds.js";
export type {
  ExternalApplicationDefinition,
  ExternalApplicationOpenMode,
  ExternalApplicationsSettings,
  ExternalApplicationTriggerBinding,
  ExternalApplicationWindowSize,
} from "./ExternalApplicationsSettings.js";
export {
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  EXTERNAL_APPLICATION_OPEN_MODES,
  EXTERNAL_APPLICATIONS_DEFAULTS,
  MAX_EXTERNAL_APPLICATION_NAME_LENGTH,
  MAX_EXTERNAL_APPLICATION_TRIGGER_DELAY_SECONDS,
  MAX_EXTERNAL_APPLICATION_URL_LENGTH,
  MAX_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MAX_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  MIN_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MIN_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  isExternalApplicationOpenMode,
} from "./ExternalApplicationsSettings.js";
export type {
  ExternalApplicationsSettingsValidationError,
  ParseExternalApplicationsSettingsResult,
} from "./parseExternalApplicationsSettings.js";
export { parseExternalApplicationsSettings } from "./parseExternalApplicationsSettings.js";
export type { MatchedExternalApplication } from "./matching/matchExternalApplications.js";
export { matchExternalApplications } from "./matching/matchExternalApplications.js";
