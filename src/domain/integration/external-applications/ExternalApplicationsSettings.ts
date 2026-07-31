/**
 * - Purpose: define immutable External Applications settings aggregate.
 * - Inputs: validated application definitions with URL templates and triggers.
 * - Outputs: profile-scoped screen-pop configuration.
 */

import type { ExternalServiceAutomaticEventType } from "../external-services/ExternalServiceEventType.js";
import type { ExternalServiceVariable } from "../external-services/ExternalServicesSettings.js";
import type { ExternalApplicationId } from "./ExternalApplicationIds.js";

export const MAX_EXTERNAL_APPLICATION_NAME_LENGTH = 120;
export const MAX_EXTERNAL_APPLICATION_URL_LENGTH = 4096;
export const MIN_EXTERNAL_APPLICATION_WINDOW_WIDTH = 320;
export const MAX_EXTERNAL_APPLICATION_WINDOW_WIDTH = 3840;
export const MIN_EXTERNAL_APPLICATION_WINDOW_HEIGHT = 240;
export const MAX_EXTERNAL_APPLICATION_WINDOW_HEIGHT = 2160;
export const DEFAULT_EXTERNAL_APPLICATION_WINDOW_WIDTH = 1100;
export const DEFAULT_EXTERNAL_APPLICATION_WINDOW_HEIGHT = 800;
export const MAX_EXTERNAL_APPLICATION_TRIGGER_DELAY_SECONDS = 180;
export const MAX_EXTERNAL_APPLICATION_QUEUE_NAME_LENGTH = 120;
export const MAX_EXTERNAL_APPLICATION_QUEUE_NAMES = 20;

export const EXTERNAL_APPLICATION_OPEN_MODES = [
  "electron_window",
  "external_browser",
] as const;

export type ExternalApplicationOpenMode =
  (typeof EXTERNAL_APPLICATION_OPEN_MODES)[number];

export const EXTERNAL_APPLICATION_CALL_DIRECTION_FILTERS = [
  "any",
  "inbound",
  "outbound",
] as const;

export type ExternalApplicationCallDirectionFilter =
  (typeof EXTERNAL_APPLICATION_CALL_DIRECTION_FILTERS)[number];

export const EXTERNAL_APPLICATION_ON_CALL_ENDED_ACTIONS = [
  "leave",
  "minimize",
  "close",
] as const;

export type ExternalApplicationOnCallEndedAction =
  (typeof EXTERNAL_APPLICATION_ON_CALL_ENDED_ACTIONS)[number];

export type ExternalApplicationWindowSize = Readonly<{
  width: number;
  height: number;
}>;

export type ExternalApplicationTriggerBinding = Readonly<{
  eventType: ExternalServiceAutomaticEventType;
  delaySeconds: number;
}>;

/** App-level filters applied after trigger match (shared by every event). */
export type ExternalApplicationConditions = Readonly<{
  callDirection: ExternalApplicationCallDirectionFilter;
  /** Empty = any queue; otherwise match if trigger queue equals one entry (case-insensitive). */
  queueNames: ReadonlyArray<string>;
}>;

/** Electron window lifecycle; ignored for external_browser open mode. */
export type ExternalApplicationWindowBehavior = Readonly<{
  raiseOnOpen: boolean;
  alwaysOnTopDuringCall: boolean;
  onCallEnded: ExternalApplicationOnCallEndedAction;
}>;

export type ExternalApplicationDefinition = Readonly<{
  id: ExternalApplicationId;
  name: string;
  enabled: boolean;
  urlTemplate: string;
  openMode: ExternalApplicationOpenMode;
  window: ExternalApplicationWindowSize;
  variables: ReadonlyArray<ExternalServiceVariable>;
  triggers: ReadonlyArray<ExternalApplicationTriggerBinding>;
  conditions: ExternalApplicationConditions;
  windowBehavior: ExternalApplicationWindowBehavior;
}>;

export type ExternalApplicationsSettings = Readonly<{
  applications: ReadonlyArray<ExternalApplicationDefinition>;
}>;

export const DEFAULT_EXTERNAL_APPLICATION_CONDITIONS: ExternalApplicationConditions =
  Object.freeze({
    callDirection: "any",
    queueNames: Object.freeze([]),
  });

export const DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR: ExternalApplicationWindowBehavior =
  Object.freeze({
    raiseOnOpen: true,
    alwaysOnTopDuringCall: false,
    onCallEnded: "leave",
  });

export const EXTERNAL_APPLICATIONS_DEFAULTS: ExternalApplicationsSettings =
  Object.freeze({
    applications: Object.freeze([]),
  });

export function isExternalApplicationOpenMode(
  value: unknown,
): value is ExternalApplicationOpenMode {
  return (
    typeof value === "string" &&
    (EXTERNAL_APPLICATION_OPEN_MODES as readonly string[]).includes(value)
  );
}

export function isExternalApplicationCallDirectionFilter(
  value: unknown,
): value is ExternalApplicationCallDirectionFilter {
  return (
    typeof value === "string" &&
    (EXTERNAL_APPLICATION_CALL_DIRECTION_FILTERS as readonly string[]).includes(
      value,
    )
  );
}

export function isExternalApplicationOnCallEndedAction(
  value: unknown,
): value is ExternalApplicationOnCallEndedAction {
  return (
    typeof value === "string" &&
    (EXTERNAL_APPLICATION_ON_CALL_ENDED_ACTIONS as readonly string[]).includes(
      value,
    )
  );
}
