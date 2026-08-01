/**
 * - Purpose: single source of truth for External Services template variable names.
 * - Inputs: none (static catalog aligned with trigger variable builders).
 * - Outputs: grouped variable names, availability ids, and `{{name}}` token formatting.
 */

export type ExternalServiceVariableCatalogGroupId =
  | "always"
  | "call"
  | "campaign"
  | "acd";

/** UI/runtime availability for a unique system name (dual-group names collapse). */
export type ExternalServiceVariableAvailabilityId =
  | ExternalServiceVariableCatalogGroupId
  | "campaign_acd";

export type ExternalServiceVariableCatalogEntry = Readonly<{
  name: string;
  group: ExternalServiceVariableCatalogGroupId;
}>;

export const EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS: ReadonlyArray<ExternalServiceVariableCatalogGroupId> =
  ["always", "call", "campaign", "acd"];

/** Stable v1 template names; keep in sync with buildExternalServiceVariables + campaign/ACD mappers. */
export const EXTERNAL_SERVICE_VARIABLE_CATALOG: ReadonlyArray<ExternalServiceVariableCatalogEntry> =
  Object.freeze([
    { name: "timestamp", group: "always" },
    { name: "event_type", group: "always" },
    { name: "user_login", group: "always" },
    { name: "call_id", group: "call" },
    { name: "caller_id", group: "call" },
    { name: "called_id", group: "call" },
    { name: "call_direction", group: "call" },
    { name: "hangup_reason", group: "call" },
    { name: "campaign_id", group: "campaign" },
    { name: "campaign_progressive", group: "campaign" },
    { name: "campaign_client_phone", group: "campaign" },
    { name: "campaign_company", group: "campaign" },
    { name: "campaign_strategy", group: "campaign" },
    { name: "campaign_selection", group: "campaign" },
    { name: "queue_name", group: "campaign" },
    { name: "queue_name", group: "acd" },
    { name: "acd_phase", group: "acd" },
    { name: "acd_event", group: "acd" },
  ]);

/** Unique system template names (campaign/ACD may share keys such as `queue_name`). */
export const EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES: ReadonlyArray<string> = Object.freeze([
  ...new Set(EXTERNAL_SERVICE_VARIABLE_CATALOG.map((entry) => entry.name)),
]);

const SYSTEM_VARIABLE_NAME_SET = new Set(EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES);

export function formatExternalServiceVariableToken(name: string): string {
  return `{{${name}}}`;
}

export function isExternalServiceSystemVariableName(name: string): boolean {
  return SYSTEM_VARIABLE_NAME_SET.has(name);
}

export function listExternalServiceVariableCatalogByGroup(
  group: ExternalServiceVariableCatalogGroupId,
): ReadonlyArray<ExternalServiceVariableCatalogEntry> {
  return EXTERNAL_SERVICE_VARIABLE_CATALOG.filter((entry) => entry.group === group);
}

/**
 * Resolves compact availability for a unique system variable name.
 * Names listed under both campaign and ACD (e.g. `queue_name`) map to `campaign_acd`.
 */
export function resolveExternalServiceSystemVariableAvailability(
  name: string,
): ExternalServiceVariableAvailabilityId | null {
  const groups = EXTERNAL_SERVICE_VARIABLE_CATALOG.filter((entry) => entry.name === name).map(
    (entry) => entry.group,
  );
  if (groups.length === 0) {
    return null;
  }
  const unique = [...new Set(groups)];
  if (unique.length === 1) {
    return unique[0] ?? null;
  }
  const hasCampaign = unique.includes("campaign");
  const hasAcd = unique.includes("acd");
  if (hasCampaign && hasAcd) {
    return "campaign_acd";
  }
  return unique[0] ?? null;
}
