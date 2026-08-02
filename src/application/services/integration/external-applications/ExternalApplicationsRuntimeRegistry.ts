/**
 * - Purpose: track active External Applications profile lifecycle and settings revision.
 * - Inputs: profile activation, settings replacements, and job stamps.
 * - Outputs: start-time validity decisions without aborting in-flight opens.
 */

import type {
  ExternalApplicationId,
  ExternalApplicationsSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import { EXTERNAL_APPLICATIONS_DEFAULTS } from "@domain/index.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";

export type ExternalApplicationsRuntimeSnapshot = Readonly<{
  profileKey: SettingsAccountKey | null;
  settings: ExternalApplicationsSettings;
  settingsRevision: number;
  lifecycleGeneration: number;
}>;

export type ExternalApplicationJobStartValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: string }>;

export class ExternalApplicationsRuntimeRegistry {
  private profileKey: SettingsAccountKey | null = null;
  private settings: ExternalApplicationsSettings = EXTERNAL_APPLICATIONS_DEFAULTS;
  private settingsRevision = 0;
  private lifecycleGeneration = 0;

  getSnapshot(): ExternalApplicationsRuntimeSnapshot {
    return {
      profileKey: this.profileKey,
      settings: this.settings,
      settingsRevision: this.settingsRevision,
      lifecycleGeneration: this.lifecycleGeneration,
    };
  }

  activateProfile(
    profileKey: SettingsAccountKey,
    settings: ExternalApplicationsSettings,
    settingsRevision = 1,
  ): void {
    this.lifecycleGeneration += 1;
    this.profileKey = profileKey;
    this.settings = settings;
    this.settingsRevision = settingsRevision;
  }

  replaceSettings(
    settings: ExternalApplicationsSettings,
    settingsRevision?: number,
  ): void {
    this.settings = settings;
    this.settingsRevision = settingsRevision ?? this.settingsRevision + 1;
  }

  invalidateLifecycle(): void {
    this.lifecycleGeneration += 1;
    this.profileKey = null;
    this.settings = EXTERNAL_APPLICATIONS_DEFAULTS;
    this.settingsRevision += 1;
  }

  validateJobStart(
    job: ExternalApplicationDispatchJob,
  ): ExternalApplicationJobStartValidation {
    if (job.lifecycleGeneration !== this.lifecycleGeneration) {
      return { ok: false, reason: "lifecycle_generation_mismatch" };
    }
    if (this.profileKey === null || job.profileKey !== this.profileKey) {
      return { ok: false, reason: "profile_mismatch" };
    }
    if (job.settingsRevision !== this.settingsRevision) {
      return { ok: false, reason: "settings_revision_mismatch" };
    }
    const application = findApplication(this.settings, job.applicationId);
    if (application === null) {
      return { ok: false, reason: "definition_missing" };
    }
    if (job.mode === "automatic" && !application.enabled) {
      return { ok: false, reason: "definition_disabled" };
    }
    return { ok: true };
  }
}

function findApplication(
  settings: ExternalApplicationsSettings,
  applicationId: ExternalApplicationId,
): ExternalApplicationsSettings["applications"][number] | null {
  return settings.applications.find((item) => item.id === applicationId) ?? null;
}
