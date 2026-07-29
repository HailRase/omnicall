/**
 * - Purpose: merge collection and normalized trigger facts into template variables.
 * - Inputs: authored collection variables and a trusted trigger context.
 * - Outputs: immutable system-precedence string dictionary.
 */
import type { SettingsAccountKey } from "../../../settings/SettingsAccountKey.js";
import type { ExternalServiceEventType } from "../ExternalServiceEventType.js";
import type { ExternalServiceVariable } from "../ExternalServicesSettings.js";
import type { ExternalServiceVariables } from "./resolveExternalServiceTemplate.js";

export type ExternalServiceTriggerContext = Readonly<{
  eventType: ExternalServiceEventType;
  occurredAt: string;
  profileKey: SettingsAccountKey;
  callId?: string | undefined;
  callerId?: string | undefined;
  calledId?: string | undefined;
  callDirection?: "inbound" | "outbound" | undefined;
  userLogin?: string | undefined;
  hangupReason?: string | undefined;
  campaign?: Readonly<Record<string, string>> | undefined;
  acd?: Readonly<Record<string, string>> | undefined;
}>;

export function buildExternalServiceVariables(
  collectionVariables: ReadonlyArray<ExternalServiceVariable>,
  trigger: ExternalServiceTriggerContext,
): ExternalServiceVariables {
  return Object.freeze({
    ...toAuthoredVariables(collectionVariables),
    ...toSystemVariables(trigger),
    ...trigger.campaign,
    ...trigger.acd,
  });
}

function toAuthoredVariables(
  collectionVariables: ReadonlyArray<ExternalServiceVariable>,
): Record<string, string> {
  return collectionVariables.reduce<Record<string, string>>(
    (variables, variable) => {
      variables[variable.key] = variable.value;
      return variables;
    },
    {},
  );
}

function toSystemVariables(
  trigger: ExternalServiceTriggerContext,
): Record<string, string> {
  return {
    timestamp: trigger.occurredAt,
    event_type: trigger.eventType,
    user_login: trigger.userLogin ?? "undefined",
    call_id: trigger.callId ?? "undefined",
    caller_id: trigger.callerId ?? "undefined",
    called_id: trigger.calledId ?? "undefined",
    call_direction: trigger.callDirection ?? "undefined",
    hangup_reason: trigger.hangupReason ?? "undefined",
  };
}
