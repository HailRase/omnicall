/**
 * - Purpose: validate and freeze persisted External Applications settings.
 * - Inputs: unknown current-schema settings slice.
 * - Outputs: immutable settings or structured path-specific validation errors.
 */

import { isExternalServiceAutomaticEventType } from "../external-services/ExternalServiceEventType.js";
import type { ExternalServiceVariable } from "../external-services/ExternalServicesSettings.js";
import {
  isExternalApplicationUuid,
  type ExternalApplicationId,
} from "./ExternalApplicationIds.js";
import {
  DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_X,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_Y,
  MAX_EXTERNAL_APPLICATION_NAME_LENGTH,
  MAX_EXTERNAL_APPLICATION_QUEUE_NAME_LENGTH,
  MAX_EXTERNAL_APPLICATION_QUEUE_NAMES,
  MAX_EXTERNAL_APPLICATION_TRIGGER_DELAY_SECONDS,
  MAX_EXTERNAL_APPLICATION_URL_LENGTH,
  MAX_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MAX_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  MAX_EXTERNAL_APPLICATION_WINDOW_X,
  MAX_EXTERNAL_APPLICATION_WINDOW_Y,
  MIN_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
  MIN_EXTERNAL_APPLICATION_WINDOW_WIDTH,
  MIN_EXTERNAL_APPLICATION_WINDOW_X,
  MIN_EXTERNAL_APPLICATION_WINDOW_Y,
  isExternalApplicationCallDirectionFilter,
  isExternalApplicationOnCallEndedAction,
  isExternalApplicationOpenMode,
  type ExternalApplicationConditions,
  type ExternalApplicationDefinition,
  type ExternalApplicationOpenMode,
  type ExternalApplicationsSettings,
  type ExternalApplicationTriggerBinding,
  type ExternalApplicationWindowBehavior,
  type ExternalApplicationWindowSize,
} from "./ExternalApplicationsSettings.js";

export type ExternalApplicationsSettingsValidationError = Readonly<{
  path: string;
  code: string;
}>;

export type ParseExternalApplicationsSettingsResult =
  | Readonly<{ ok: true; value: ExternalApplicationsSettings }>
  | Readonly<{
      ok: false;
      errors: ReadonlyArray<ExternalApplicationsSettingsValidationError>;
    }>;

export function parseExternalApplicationsSettings(
  value: unknown,
): ParseExternalApplicationsSettingsResult {
  const errors: ExternalApplicationsSettingsValidationError[] = [];
  if (!isRecord(value)) {
    return fail(errors, "$", "not_object");
  }
  if (!Array.isArray(value["applications"])) {
    return fail(errors, "applications", "not_array");
  }

  const applicationIds = new Set<string>();
  const applications = value["applications"].map((application, index) =>
    parseApplication(application, `applications[${index}]`, applicationIds, errors),
  );

  return errors.length === 0
    ? {
        ok: true,
        value: Object.freeze({ applications: Object.freeze(applications) }),
      }
    : { ok: false, errors: Object.freeze(errors) };
}

function parseApplication(
  value: unknown,
  path: string,
  applicationIds: Set<string>,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationDefinition {
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return emptyApplication();
  }

  const id = parseUuid(value["id"], `${path}.id`, applicationIds, errors);
  const name = parseName(value["name"], `${path}.name`, errors);
  const enabled = parseBoolean(value["enabled"], `${path}.enabled`, errors);
  const urlTemplate = parseUrlTemplate(value["urlTemplate"], `${path}.urlTemplate`, errors);
  const openMode = parseOpenMode(value["openMode"], `${path}.openMode`, errors);
  const window = parseWindow(value["window"], `${path}.window`, errors);
  const variables = parseVariables(value["variables"], `${path}.variables`, errors);
  const triggers = parseTriggers(value["triggers"], `${path}.triggers`, errors);
  const conditions = parseConditions(value["conditions"], `${path}.conditions`, errors);
  const windowBehavior = parseWindowBehavior(
    value["windowBehavior"],
    `${path}.windowBehavior`,
    errors,
  );

  return Object.freeze({
    id,
    name,
    enabled,
    urlTemplate,
    openMode,
    window,
    variables: Object.freeze(variables),
    triggers: Object.freeze(triggers),
    conditions,
    windowBehavior,
  });
}

function parseConditions(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationConditions {
  if (value === undefined) {
    return DEFAULT_EXTERNAL_APPLICATION_CONDITIONS;
  }
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return DEFAULT_EXTERNAL_APPLICATION_CONDITIONS;
  }
  const callDirectionRaw = value["callDirection"];
  const callDirection = isExternalApplicationCallDirectionFilter(callDirectionRaw)
    ? callDirectionRaw
    : (() => {
        invalid(errors, `${path}.callDirection`, "invalid");
        return DEFAULT_EXTERNAL_APPLICATION_CONDITIONS.callDirection;
      })();
  const queueNames = parseQueueNames(value, `${path}`, errors);
  return Object.freeze({
    callDirection,
    queueNames: Object.freeze(queueNames),
  });
}

function parseQueueNames(
  value: Record<string, unknown>,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string[] {
  if (Array.isArray(value["queueNames"])) {
    if (value["queueNames"].length > MAX_EXTERNAL_APPLICATION_QUEUE_NAMES) {
      invalid(errors, `${path}.queueNames`, "too_many");
    }
    const names: string[] = [];
    const seen = new Set<string>();
    for (const [index, candidate] of value["queueNames"].entries()) {
      const name = parseQueueName(candidate, `${path}.queueNames[${index}]`, errors);
      if (name.length === 0) {
        continue;
      }
      const key = name.toLocaleLowerCase();
      if (seen.has(key)) {
        invalid(errors, `${path}.queueNames[${index}]`, "duplicate");
        continue;
      }
      seen.add(key);
      names.push(name);
    }
    return names.slice(0, MAX_EXTERNAL_APPLICATION_QUEUE_NAMES);
  }

  // v15 compatibility: single queueNameEquals → one-entry list
  if (value["queueNameEquals"] !== undefined) {
    const legacy = parseQueueName(
      value["queueNameEquals"],
      `${path}.queueNameEquals`,
      errors,
    );
    return legacy.length > 0 ? [legacy] : [];
  }

  return [];
}

function parseWindowBehavior(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationWindowBehavior {
  if (value === undefined) {
    return DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR;
  }
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR;
  }
  const raiseOnOpen = parseBoolean(
    value["raiseOnOpen"],
    `${path}.raiseOnOpen`,
    errors,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR.raiseOnOpen,
  );
  const alwaysOnTopDuringCall = parseBoolean(
    value["alwaysOnTopDuringCall"],
    `${path}.alwaysOnTopDuringCall`,
    errors,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR.alwaysOnTopDuringCall,
  );
  const onCallEndedRaw = value["onCallEnded"];
  const onCallEnded = isExternalApplicationOnCallEndedAction(onCallEndedRaw)
    ? onCallEndedRaw
    : (() => {
        invalid(errors, `${path}.onCallEnded`, "invalid");
        return DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR.onCallEnded;
      })();
  return Object.freeze({ raiseOnOpen, alwaysOnTopDuringCall, onCallEnded });
}

function parseQueueName(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_EXTERNAL_APPLICATION_QUEUE_NAME_LENGTH) {
    invalid(errors, path, "too_long");
    return trimmed.slice(0, MAX_EXTERNAL_APPLICATION_QUEUE_NAME_LENGTH);
  }
  return trimmed;
}

function parseVariables(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
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

function parseTriggers(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationTriggerBinding[] {
  if (!Array.isArray(value)) {
    invalid(errors, path, "not_array");
    return [];
  }
  const seen = new Set<string>();
  return value.map((binding, index) => {
    const rowPath = `${path}[${index}]`;
    if (!isRecord(binding)) {
      invalid(errors, rowPath, "not_object");
      return Object.freeze({
        eventType: "incoming_ringing",
        delaySeconds: 0,
      });
    }
    const eventTypeRaw = binding["eventType"];
    if (!isExternalServiceAutomaticEventType(eventTypeRaw)) {
      invalid(errors, `${rowPath}.eventType`, "invalid");
      return Object.freeze({
        eventType: "incoming_ringing",
        delaySeconds: 0,
      });
    }
    if (seen.has(eventTypeRaw)) {
      invalid(errors, `${rowPath}.eventType`, "duplicate");
    }
    seen.add(eventTypeRaw);
    const delaySeconds = parseDelaySeconds(
      binding["delaySeconds"],
      `${rowPath}.delaySeconds`,
      errors,
    );
    return Object.freeze({ eventType: eventTypeRaw, delaySeconds });
  });
}

function parseWindow(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationWindowSize {
  if (!isRecord(value)) {
    invalid(errors, path, "not_object");
    return Object.freeze({
      width: DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
      height: DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
      x: DEFAULT_EXTERNAL_APPLICATION_WINDOW_X,
      y: DEFAULT_EXTERNAL_APPLICATION_WINDOW_Y,
    });
  }
  const width = parseWindowDimension(
    value["width"],
    `${path}.width`,
    MIN_EXTERNAL_APPLICATION_WINDOW_WIDTH,
    MAX_EXTERNAL_APPLICATION_WINDOW_WIDTH,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
    errors,
  );
  const height = parseWindowDimension(
    value["height"],
    `${path}.height`,
    MIN_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
    MAX_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
    errors,
  );
  const x = parseWindowCoordinate(
    value["x"],
    `${path}.x`,
    MIN_EXTERNAL_APPLICATION_WINDOW_X,
    MAX_EXTERNAL_APPLICATION_WINDOW_X,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_X,
    errors,
  );
  const y = parseWindowCoordinate(
    value["y"],
    `${path}.y`,
    MIN_EXTERNAL_APPLICATION_WINDOW_Y,
    MAX_EXTERNAL_APPLICATION_WINDOW_Y,
    DEFAULT_EXTERNAL_APPLICATION_WINDOW_Y,
    errors,
  );
  return Object.freeze({ width, height, x, y });
}

/** Missing coordinate → default (backward compatible); invalid → default + error. */
function parseWindowCoordinate(
  value: unknown,
  path: string,
  min: number,
  max: number,
  fallback: number,
  errors: ExternalApplicationsSettingsValidationError[],
): number {
  if (value === undefined) {
    return fallback;
  }
  return parseWindowDimension(value, path, min, max, fallback, errors);
}

function parseWindowDimension(
  value: unknown,
  path: string,
  min: number,
  max: number,
  fallback: number,
  errors: ExternalApplicationsSettingsValidationError[],
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    invalid(errors, path, "not_integer");
    return fallback;
  }
  if (value < min || value > max) {
    invalid(errors, path, "out_of_range");
    return fallback;
  }
  return value;
}

function parseDelaySeconds(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): number {
  if (value === undefined) {
    return 0;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    invalid(errors, path, "not_integer");
    return 0;
  }
  if (value < 0 || value > MAX_EXTERNAL_APPLICATION_TRIGGER_DELAY_SECONDS) {
    invalid(errors, path, "out_of_range");
    return 0;
  }
  return value;
}

function parseOpenMode(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationOpenMode {
  if (!isExternalApplicationOpenMode(value)) {
    invalid(errors, path, "invalid");
    return "electron_window";
  }
  return value;
}

function parseUrlTemplate(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string {
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    invalid(errors, path, "empty");
    return "";
  }
  if (trimmed.length > MAX_EXTERNAL_APPLICATION_URL_LENGTH) {
    invalid(errors, path, "too_long");
    return trimmed.slice(0, MAX_EXTERNAL_APPLICATION_URL_LENGTH);
  }
  return trimmed;
}

function parseName(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string {
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    invalid(errors, path, "empty");
    return "";
  }
  if (trimmed.length > MAX_EXTERNAL_APPLICATION_NAME_LENGTH) {
    invalid(errors, path, "too_long");
    return trimmed.slice(0, MAX_EXTERNAL_APPLICATION_NAME_LENGTH);
  }
  return trimmed;
}

function parseUuid(
  value: unknown,
  path: string,
  seen: Set<string>,
  errors: ExternalApplicationsSettingsValidationError[],
): ExternalApplicationId {
  if (typeof value !== "string" || !isExternalApplicationUuid(value)) {
    invalid(errors, path, "invalid_uuid");
    return "" as ExternalApplicationId;
  }
  if (seen.has(value)) {
    invalid(errors, path, "duplicate");
  }
  seen.add(value);
  return value as ExternalApplicationId;
}

function parseBoolean(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
  fallback = false,
): boolean {
  if (typeof value !== "boolean") {
    invalid(errors, path, "not_boolean");
    return fallback;
  }
  return value;
}

function parseString(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string {
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  return value;
}

function parseNonEmptyTrimmedString(
  value: unknown,
  path: string,
  errors: ExternalApplicationsSettingsValidationError[],
): string {
  if (typeof value !== "string") {
    invalid(errors, path, "not_string");
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    invalid(errors, path, "empty");
    return "";
  }
  return trimmed;
}

function emptyApplication(): ExternalApplicationDefinition {
  return Object.freeze({
    id: "" as ExternalApplicationId,
    name: "",
    enabled: false,
    urlTemplate: "",
    openMode: "electron_window",
    window: Object.freeze({
      width: DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH,
      height: DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT,
      x: DEFAULT_EXTERNAL_APPLICATION_WINDOW_X,
      y: DEFAULT_EXTERNAL_APPLICATION_WINDOW_Y,
    }),
    variables: Object.freeze([]),
    triggers: Object.freeze([]),
    conditions: DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
    windowBehavior: DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(
  errors: ExternalApplicationsSettingsValidationError[],
  path: string,
  code: string,
): void {
  errors.push({ path, code });
}

function fail(
  errors: ExternalApplicationsSettingsValidationError[],
  path: string,
  code: string,
): ParseExternalApplicationsSettingsResult {
  invalid(errors, path, code);
  return { ok: false, errors: Object.freeze(errors) };
}
