/**
 * - Purpose: expose External Applications domain configuration contracts.
 * - Inputs: validated settings values and parser requests.
 * - Outputs: stable public domain types, constants, and parser API.
 */

export type { ExternalApplicationId } from "./ExternalApplicationIds.js";
export { isExternalApplicationUuid } from "./ExternalApplicationIds.js";
export type {
  ExternalApplicationCallDirectionFilter,
  ExternalApplicationConditions,
  ExternalApplicationDefinition,
  ExternalApplicationOnCallEndedAction,
  ExternalApplicationOpenMode,
  ExternalApplicationsSettings,
  ExternalApplicationTriggerBinding,
  ExternalApplicationWindowBehavior,
  ExternalApplicationWindowSize,
} from "./ExternalApplicationsSettings.js";
export {
  DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  EXTERNAL_APPLICATION_CALL_DIRECTION_FILTERS,
  EXTERNAL_APPLICATION_ON_CALL_ENDED_ACTIONS,
  EXTERNAL_APPLICATION_OPEN_MODES,
  EXTERNAL_APPLICATIONS_DEFAULTS,
  MAX_EXTERNAL_APPLICATION_NAME_LENGTH,
  MAX_EXTERNAL_APPLICATION_QUEUE_NAME_LENGTH,
  MAX_EXTERNAL_APPLICATION_QUEUE_NAMES,
  MAX_EXTERNAL_APPLICATION_TRIGGER_DELAY_SECONDS,
  MAX_EXTERNAL_APPLICATION_URL_LENGTH,
  MAX_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MAX_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  MIN_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MIN_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  isExternalApplicationCallDirectionFilter,
  isExternalApplicationOnCallEndedAction,
  isExternalApplicationOpenMode,
} from "./ExternalApplicationsSettings.js";
export type {
  ExternalApplicationsSettingsValidationError,
  ParseExternalApplicationsSettingsResult,
} from "./parseExternalApplicationsSettings.js";
export { parseExternalApplicationsSettings } from "./parseExternalApplicationsSettings.js";
export type { MatchedExternalApplication } from "./matching/matchExternalApplications.js";
export { matchExternalApplications } from "./matching/matchExternalApplications.js";
export type {
  ExternalApplicationConditionSkipReason,
  ExternalApplicationConditionsResult,
} from "./evaluateExternalApplicationConditions.js";
export {
  EXTERNAL_APPLICATION_CONDITION_SKIP_REASONS,
  evaluateExternalApplicationConditions,
} from "./evaluateExternalApplicationConditions.js";
export type {
  ExternalApplicationJournalEntry,
  ExternalApplicationJournalOutcome,
} from "./ExternalApplicationJournalEntry.js";
export { EXTERNAL_APPLICATION_JOURNAL_OUTCOMES } from "./ExternalApplicationJournalEntry.js";
