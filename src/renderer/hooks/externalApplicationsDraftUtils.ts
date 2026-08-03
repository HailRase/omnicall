/**
 * - Purpose: pure helpers for External Applications panel drafts.
 * - Inputs: settings aggregates and target application ids/flags.
 * - Outputs: created/duplicated apps, enabled patches, dirty equality.
 */

import type { UserSettings } from "@application/index.js";

export type ExternalApplicationsSettings = UserSettings["externalApplications"];
export type ExternalApplication = ExternalApplicationsSettings["applications"][number];
export type ExternalApplicationId = ExternalApplication["id"];

export function createExternalApplication(): ExternalApplication {
  return {
    id: crypto.randomUUID() as ExternalApplicationId,
    name: "App",
    enabled: true,
    urlTemplate: "https://example.com/{{call_id}}",
    openMode: "electron_window",
    window: { width: 1100, height: 800, x: 100, y: 100 },
    variables: [],
    triggers: [],
    conditions: {
      callDirection: "any",
      queueNames: [],
    },
    windowBehavior: {
      raiseOnOpen: true,
      alwaysOnTopDuringCall: false,
      onCallEnded: "leave",
    },
  };
}

export function duplicateExternalApplication(
  source: ExternalApplication,
): ExternalApplication {
  return {
    ...source,
    id: crypto.randomUUID() as ExternalApplicationId,
    name: `${source.name} copy`,
    variables: source.variables.map((variable) => ({ ...variable })),
    triggers: source.triggers.map((trigger) => ({ ...trigger })),
    window: { ...source.window },
    conditions: { ...source.conditions },
    windowBehavior: { ...source.windowBehavior },
  };
}

export function patchApplicationEnabled(
  settings: ExternalApplicationsSettings,
  id: ExternalApplicationId,
  enabled: boolean,
): ExternalApplicationsSettings {
  return {
    applications: settings.applications.map((application) =>
      application.id === id ? { ...application, enabled } : application,
    ),
  };
}

export function areExternalApplicationsSettingsEqual(
  left: ExternalApplicationsSettings,
  right: ExternalApplicationsSettings,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
