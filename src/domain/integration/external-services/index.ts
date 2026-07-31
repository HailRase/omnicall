/**
 * - Purpose: expose External Services domain configuration contracts.
 * - Inputs: validated settings values and parser requests.
 * - Outputs: stable public domain types, constants, and parser API.
 */

export type {
  ExternalServiceCollectionId,
  ExternalServiceKeyValueId,
  ExternalServiceRequestId,
} from "./ExternalServiceIds.js";
export { isExternalServiceUuid } from "./ExternalServiceIds.js";
export type {
  ExternalServiceAutomaticEventType,
  ExternalServiceEventType,
} from "./ExternalServiceEventType.js";
export {
  EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  isExternalServiceAutomaticEventType,
} from "./ExternalServiceEventType.js";
export type {
  ExternalServiceBodyMode,
  ExternalServiceHttpMethod,
  ExternalServiceKeyValue,
  ExternalServiceRequest,
  ExternalServiceRequestBody,
  ExternalServiceTriggerBinding,
} from "./ExternalServiceHttpDefinition.js";
export {
  EXTERNAL_SERVICE_BODY_MODES,
  EXTERNAL_SERVICE_HTTP_METHODS,
  MAX_EXTERNAL_SERVICE_TRIGGER_DELAY_SECONDS,
  isExternalServiceBodyMode,
  isExternalServiceHttpMethod,
} from "./ExternalServiceHttpDefinition.js";
export type {
  ExternalServiceCollection,
  ExternalServicesSettings,
  ExternalServiceVariable,
} from "./ExternalServicesSettings.js";
export {
  EXTERNAL_SERVICES_DEFAULTS,
  MAX_EXTERNAL_SERVICE_NAME_LENGTH,
} from "./ExternalServicesSettings.js";
export type {
  ExternalServiceJournalEntry,
  ExternalServiceJournalOutcome,
} from "./ExternalServiceJournalEntry.js";
export {
  EXTERNAL_SERVICE_JOURNAL_OUTCOMES,
} from "./ExternalServiceJournalEntry.js";
export type {
  ExternalServicesSettingsValidationError,
  ParseExternalServicesSettingsResult,
} from "./parseExternalServicesSettings.js";
export { parseExternalServicesSettings } from "./parseExternalServicesSettings.js";
export type {
  MatchedExternalServiceRequest,
} from "./matching/matchExternalServiceRequests.js";
export { matchExternalServiceRequests } from "./matching/matchExternalServiceRequests.js";
export type {
  ExternalServiceHttpRequest,
  ExternalServiceHttpRequestBuildResult,
} from "./http/buildExternalServiceHttpRequest.js";
export { buildExternalServiceHttpRequest } from "./http/buildExternalServiceHttpRequest.js";
export type {
  ExternalServiceTriggerContext,
} from "./template/buildExternalServiceVariables.js";
export { buildExternalServiceVariables } from "./template/buildExternalServiceVariables.js";
export type {
  ExternalServiceVariableCatalogEntry,
  ExternalServiceVariableCatalogGroupId,
} from "./template/ExternalServiceVariableCatalog.js";
export {
  EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES,
  EXTERNAL_SERVICE_VARIABLE_CATALOG,
  EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS,
  formatExternalServiceVariableToken,
  isExternalServiceSystemVariableName,
  listExternalServiceVariableCatalogByGroup,
} from "./template/ExternalServiceVariableCatalog.js";
export type {
  ExternalServiceCollectionVariableRowInspection,
  ExternalServiceCollectionVariableRowIssue,
  ExternalServiceCollectionVariablesNormalizeError,
  NormalizeExternalServiceCollectionVariablesResult,
} from "./template/normalizeExternalServiceCollectionVariables.js";
export {
  hasBlockingExternalServiceCollectionVariableIssues,
  inspectExternalServiceCollectionVariableRows,
  normalizeExternalServiceCollectionVariables,
} from "./template/normalizeExternalServiceCollectionVariables.js";
export type { ExternalServiceVariables } from "./template/resolveExternalServiceTemplate.js";
export { resolveExternalServiceTemplate } from "./template/resolveExternalServiceTemplate.js";
export { redactExternalServiceHeaders } from "./security/redactExternalServiceHeaders.js";
export type { TruncatedExternalServiceBody } from "./security/truncateExternalServiceBody.js";
export {
  EXTERNAL_SERVICE_RESPONSE_BODY_MAX_BYTES,
  truncateExternalServiceBody,
} from "./security/truncateExternalServiceBody.js";
export type {
  ExternalServiceCollectionDocumentV1,
  ExternalServiceCollectionFormatId,
  ExternalServiceCollectionFormatVersion,
  ExternalServiceCollectionParseErrorCode,
  ExternalServiceCollectionParseResult,
  ExternalServiceUuidSource,
} from "./ExternalServiceCollectionDocument.js";
export {
  EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES,
  EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
  EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION,
  buildExternalServiceCollectionDocument,
  buildExternalServiceCollectionSuggestedFileName,
  parseExternalServiceCollectionDocument,
  parseExternalServiceCollectionJson,
  regenerateExternalServiceCollectionIds,
  resolveImportedExternalServiceCollectionName,
  serializeExternalServiceCollectionDocument,
} from "./ExternalServiceCollectionDocument.js";
