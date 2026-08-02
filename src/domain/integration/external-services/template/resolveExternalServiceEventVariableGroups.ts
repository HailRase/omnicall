/**
 * - Purpose: map trigger event codes to system variable catalog groups filled for that event.
 * - Inputs: ExternalServiceEventType (automatic or manual_run).
 * - Outputs: ordered catalog group ids matching Variables-tab when-available semantics.
 */

import type { ExternalServiceEventType } from "../ExternalServiceEventType.js";
import {
  EXTERNAL_SERVICE_VARIABLE_CATALOG,
  type ExternalServiceVariableCatalogEntry,
  type ExternalServiceVariableCatalogGroupId,
} from "./ExternalServiceVariableCatalog.js";

const CALL_LIFECYCLE_EVENTS = new Set<ExternalServiceEventType>([
  "incoming_ringing",
  "outgoing_connecting",
  "call_answered",
  "call_ended",
  "call_rejected",
  "call_missed",
]);

const CAMPAIGN_EVENTS = new Set<ExternalServiceEventType>([
  "campaign_offered",
  "campaign_accepted",
  "campaign_rejected",
]);

/**
 * System catalog groups that receive real facts for the event (not out-of-context).
 * Align with `mapDomainEventToExternalServiceTrigger` + `buildExternalServiceVariables`.
 * `manual_run` includes `call` only when a focused call exists at run time; UI lists the group
 * as potentially available (same as Variables tab Call when-hint).
 */
export function resolveExternalServiceEventVariableGroups(
  eventType: ExternalServiceEventType,
): ReadonlyArray<ExternalServiceVariableCatalogGroupId> {
  if (CALL_LIFECYCLE_EVENTS.has(eventType) || eventType === "manual_run") {
    return Object.freeze(["always", "call"]);
  }
  if (CAMPAIGN_EVENTS.has(eventType)) {
    return Object.freeze(["always", "campaign"]);
  }
  if (eventType === "acd_context_appeared") {
    return Object.freeze(["always", "call", "acd"]);
  }
  return Object.freeze(["always"]);
}

/**
 * Catalog entries belonging to groups available for the event (preserves dual-group rows).
 */
export function listExternalServiceCatalogEntriesForEvent(
  eventType: ExternalServiceEventType,
): ReadonlyArray<ExternalServiceVariableCatalogEntry> {
  const groups = new Set(resolveExternalServiceEventVariableGroups(eventType));
  return EXTERNAL_SERVICE_VARIABLE_CATALOG.filter((entry) => groups.has(entry.group));
}
