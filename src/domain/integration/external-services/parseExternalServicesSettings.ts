/**
 * - Purpose: validate and freeze persisted External Services settings.
 * - Inputs: unknown current-schema settings slice.
 * - Outputs: immutable settings or structured path-specific validation errors.
 */

import {
  isExternalServiceUuid,
  type ExternalServiceCollectionId,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequestId,
} from "./ExternalServiceIds.js";
import {
  isExternalServiceAutomaticEventType,
  type ExternalServiceAutomaticEventType,
} from "./ExternalServiceEventType.js";
import {
  isExternalServiceBodyMode,
  isExternalServiceHttpMethod,
  type ExternalServiceKeyValue,
  type ExternalServiceRequest,
  type ExternalServiceRequestBody,
} from "./ExternalServiceHttpDefinition.js";
import {
  MAX_EXTERNAL_SERVICE_NAME_LENGTH,
  type ExternalServiceCollection,
  type ExternalServicesSettings,
  type ExternalServiceVariable,
} from "./ExternalServicesSettings.js";

export type ExternalServicesSettingsValidationError = Readonly<{
  path: string;
  code: string;
}>;

export type ParseExternalServicesSettingsResult =
  | Readonly<{ ok: true; value: ExternalServicesSettings }>
  | Readonly<{ ok: false; errors: ReadonlyArray<ExternalServicesSettingsValidationError> }>;

export function parseExternalServicesSettings(
  value: unknown,
): ParseExternalServicesSettingsResult {
  const errors: ExternalServicesSettingsValidationError[] = [];
  if (!isRecord(value)) {
    return fail(errors, "$", "not_object");
  }
  if (!Array.isArray(value["collections"])) {
    return fail(errors, "collections", "not_array");
  }

  const collectionIds = new Set<string>();
  const requestIds = new Set<string>();
  const keyValueIds = new Set<string>();
  const collections = value["collections"].map((collection, index) =>
    parseCollection(
      collection,
      `collections[${index}]`,
      collectionIds,
      requestIds,
      keyValueIds,
      errors,
    ),
  );

  return errors.length === 0
    ? { ok: true, value: Object.freeze({ collections: Object.freeze(collections) }) }
    : { ok: false, errors: Object.freeze(errors) };
}

function parseCollection(
  value: unknown,
  path: string,
  collectionIds: Set<string>,
  requestIds: Set<string>,
  keyValueIds: Set<string>,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceCollection {
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return emptyCollection();
  }

  const id = parseUuid(value["id"], `${path}.id`, collectionIds, errors) as ExternalServiceCollectionId;
  const name = parseName(value["name"], `${path}.name`, errors);
  const enabled = parseBoolean(value["enabled"], `${path}.enabled`, errors);
  const variables = parseVariables(value["variables"], `${path}.variables`, errors);
  const requests = parseRequests(
    value["requests"],
    `${path}.requests`,
    requestIds,
    keyValueIds,
    errors,
  );
  return Object.freeze({ id, name, enabled, variables: Object.freeze(variables), requests: Object.freeze(requests) });
}

function parseVariables(
  value: unknown,
  path: string,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceVariable[] {
  if (!Array.isArray(value)) {
    invalid(errors, path, "not_array");
    return [];
  }
  const keys = new Set<string>();
  return value.map((variable, index) => {
    const rowPath = `${path}[${index}]`;
    if (!isRecord(variable)) {
      invalid(errors, rowPath, "not_object");
      return Object.freeze({ key: "", value: "" });
    }
    const key = parseNonEmptyTrimmedString(variable["key"], `${rowPath}.key`, errors);
    if (keys.has(key)) {
      invalid(errors, `${rowPath}.key`, "duplicate");
    }
    keys.add(key);
    const variableValue = parseString(variable["value"], `${rowPath}.value`, errors);
    return Object.freeze({ key, value: variableValue });
  });
}

function parseRequests(
  value: unknown,
  path: string,
  requestIds: Set<string>,
  keyValueIds: Set<string>,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceRequest[] {
  if (!Array.isArray(value)) {
    invalid(errors, path, "not_array");
    return [];
  }
  return value.map((request, index) =>
    parseRequest(request, `${path}[${index}]`, requestIds, keyValueIds, errors),
  );
}

function parseRequest(
  value: unknown,
  path: string,
  requestIds: Set<string>,
  keyValueIds: Set<string>,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceRequest {
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return emptyRequest();
  }
  const id = parseUuid(value["id"], `${path}.id`, requestIds, errors) as ExternalServiceRequestId;
  const name = parseName(value["name"], `${path}.name`, errors);
  const enabled = parseBoolean(value["enabled"], `${path}.enabled`, errors);
  const method = isExternalServiceHttpMethod(value["method"])
    ? value["method"]
    : (invalid(errors, `${path}.method`, "invalid"), "GET" as const);
  const url = parseNonEmptyTrimmedString(value["url"], `${path}.url`, errors);
  const query = parseKeyValues(value["query"], `${path}.query`, keyValueIds, errors);
  const headers = parseKeyValues(value["headers"], `${path}.headers`, keyValueIds, errors);
  const body = parseBody(value["body"], `${path}.body`, errors);
  const triggers = parseTriggers(value["triggers"], `${path}.triggers`, errors);
  return Object.freeze({
    id, name, enabled, method, url, query: Object.freeze(query), headers: Object.freeze(headers), body, triggers: Object.freeze(triggers),
  });
}

function parseKeyValues(
  value: unknown,
  path: string,
  keyValueIds: Set<string>,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceKeyValue[] {
  if (!Array.isArray(value)) {
    invalid(errors, path, "not_array");
    return [];
  }
  return value.map((row, index) => {
    const rowPath = `${path}[${index}]`;
    if (!isRecord(row)) {
      invalid(errors, rowPath, "not_object");
      return emptyKeyValue();
    }
    const id = parseUuid(row["id"], `${rowPath}.id`, keyValueIds, errors) as ExternalServiceKeyValueId;
    const enabled = parseBoolean(row["enabled"], `${rowPath}.enabled`, errors);
    const key = parseString(row["key"], `${rowPath}.key`, errors).trim();
    if (enabled && key.length === 0) {
      invalid(errors, `${rowPath}.key`, "empty");
    }
    return Object.freeze({ id, key, value: parseString(row["value"], `${rowPath}.value`, errors), enabled });
  });
}

function parseBody(
  value: unknown,
  path: string,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceRequestBody {
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return Object.freeze({ mode: "none", value: "" });
  }
  const mode = isExternalServiceBodyMode(value["mode"])
    ? value["mode"]
    : (invalid(errors, `${path}.mode`, "invalid"), "none" as const);
  const bodyValue = parseString(value["value"], `${path}.value`, errors);
  if (mode === "none" && bodyValue.length > 0) {
    invalid(errors, `${path}.value`, "must_be_empty");
  }
  return Object.freeze({ mode, value: bodyValue });
}

function parseTriggers(
  value: unknown,
  path: string,
  errors: ExternalServicesSettingsValidationError[],
): ExternalServiceAutomaticEventType[] {
  if (!Array.isArray(value)) {
    invalid(errors, path, "not_array");
    return [];
  }
  const seen = new Set<string>();
  return value.map((trigger, index) => {
    const triggerPath = `${path}[${index}]`;
    if (!isExternalServiceAutomaticEventType(trigger)) {
      invalid(errors, triggerPath, "invalid");
      return "incoming_ringing";
    }
    if (seen.has(trigger)) {
      invalid(errors, triggerPath, "duplicate");
    }
    seen.add(trigger);
    return trigger;
  });
}

function parseUuid(
  value: unknown,
  path: string,
  seen: Set<string>,
  errors: ExternalServicesSettingsValidationError[],
): string {
  if (typeof value !== "string" || !isExternalServiceUuid(value)) {
    invalid(errors, path, "invalid_uuid");
    return "";
  }
  if (seen.has(value)) {
    invalid(errors, path, "duplicate");
  }
  seen.add(value);
  return value;
}

function parseName(value: unknown, path: string, errors: ExternalServicesSettingsValidationError[]): string {
  const name = parseNonEmptyTrimmedString(value, path, errors);
  if (name.length > MAX_EXTERNAL_SERVICE_NAME_LENGTH) {
    invalid(errors, path, "too_long");
  }
  return name;
}

function parseNonEmptyTrimmedString(
  value: unknown,
  path: string,
  errors: ExternalServicesSettingsValidationError[],
): string {
  const parsed = parseString(value, path, errors).trim();
  if (parsed.length === 0) {
    invalid(errors, path, "empty");
  }
  return parsed;
}

function parseString(value: unknown, path: string, errors: ExternalServicesSettingsValidationError[]): string {
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  return value;
}

function parseBoolean(value: unknown, path: string, errors: ExternalServicesSettingsValidationError[]): boolean {
  if (typeof value !== "boolean") {
    invalid(errors, path, "not_boolean");
    return false;
  }
  return value;
}

function invalid(
  errors: ExternalServicesSettingsValidationError[],
  path: string,
  code: string,
): void {
  errors.push(Object.freeze({ path, code }));
}

function fail(
  errors: ExternalServicesSettingsValidationError[],
  path: string,
  code: string,
): ParseExternalServicesSettingsResult {
  invalid(errors, path, code);
  return { ok: false, errors: Object.freeze(errors) };
}

function emptyCollection(): ExternalServiceCollection {
  return Object.freeze({ id: "" as ExternalServiceCollectionId, name: "", enabled: false, variables: Object.freeze([]), requests: Object.freeze([]) });
}

function emptyRequest(): ExternalServiceRequest {
  return Object.freeze({
    id: "" as ExternalServiceRequestId, name: "", enabled: false, method: "GET", url: "", query: Object.freeze([]), headers: Object.freeze([]), body: Object.freeze({ mode: "none", value: "" }), triggers: Object.freeze([]),
  });
}

function emptyKeyValue(): ExternalServiceKeyValue {
  return Object.freeze({ id: "" as ExternalServiceKeyValueId, key: "", value: "", enabled: false });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
