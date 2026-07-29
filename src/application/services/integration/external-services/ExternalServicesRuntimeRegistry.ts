/**
 * - Purpose: track active External Services profile lifecycle and settings revision.
 * - Inputs: profile activation, settings replacements, and queued job stamps.
 * - Outputs: start-time validity decisions without aborting in-flight work.
 */

import type {
  ExternalServiceCollectionId,
  ExternalServiceRequestId,
  ExternalServicesSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import { EXTERNAL_SERVICES_DEFAULTS } from "@domain/index.js";
import type { ExternalServiceDispatchJob } from "./ExternalServiceDispatchJob.js";

export type ExternalServicesRuntimeSnapshot = Readonly<{
  profileKey: SettingsAccountKey | null;
  settings: ExternalServicesSettings;
  settingsRevision: number;
  lifecycleGeneration: number;
}>;

export type ExternalServiceJobStartValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: string }>;

export class ExternalServicesRuntimeRegistry {
  private profileKey: SettingsAccountKey | null = null;
  private settings: ExternalServicesSettings = EXTERNAL_SERVICES_DEFAULTS;
  private settingsRevision = 0;
  private lifecycleGeneration = 0;

  getSnapshot(): ExternalServicesRuntimeSnapshot {
    return {
      profileKey: this.profileKey,
      settings: this.settings,
      settingsRevision: this.settingsRevision,
      lifecycleGeneration: this.lifecycleGeneration,
    };
  }

  activateProfile(
    profileKey: SettingsAccountKey,
    settings: ExternalServicesSettings,
    settingsRevision = 1,
  ): void {
    this.lifecycleGeneration += 1;
    this.profileKey = profileKey;
    this.settings = settings;
    this.settingsRevision = settingsRevision;
  }

  replaceSettings(
    settings: ExternalServicesSettings,
    settingsRevision?: number,
  ): void {
    this.settings = settings;
    this.settingsRevision =
      settingsRevision ?? this.settingsRevision + 1;
  }

  syncFromSnapshot(
    profileKey: SettingsAccountKey,
    settings: ExternalServicesSettings,
    settingsRevision: number,
  ): void {
    if (this.profileKey !== profileKey) {
      this.lifecycleGeneration += 1;
      this.profileKey = profileKey;
    }
    this.settings = settings;
    this.settingsRevision = settingsRevision;
  }

  invalidateLifecycle(): void {
    this.lifecycleGeneration += 1;
    this.profileKey = null;
    this.settings = EXTERNAL_SERVICES_DEFAULTS;
    this.settingsRevision += 1;
  }

  validateJobStart(job: ExternalServiceDispatchJob): ExternalServiceJobStartValidation {
    if (job.lifecycleGeneration !== this.lifecycleGeneration) {
      return { ok: false, reason: "lifecycle_generation_mismatch" };
    }
    if (this.profileKey === null || job.profileKey !== this.profileKey) {
      return { ok: false, reason: "profile_mismatch" };
    }
    if (job.settingsRevision !== this.settingsRevision) {
      return { ok: false, reason: "settings_revision_mismatch" };
    }
    const definition = findDefinition(
      this.settings,
      job.collectionId,
      job.requestId,
    );
    if (definition === null) {
      return { ok: false, reason: "definition_missing" };
    }
    if (
      job.mode === "automatic" &&
      (!definition.collection.enabled || !definition.request.enabled)
    ) {
      return { ok: false, reason: "definition_disabled" };
    }
    return { ok: true };
  }
}

function findDefinition(
  settings: ExternalServicesSettings,
  collectionId: ExternalServiceCollectionId,
  requestId: ExternalServiceRequestId,
): Readonly<{
  collection: ExternalServicesSettings["collections"][number];
  request: ExternalServicesSettings["collections"][number]["requests"][number];
}> | null {
  const collection = settings.collections.find((item) => item.id === collectionId);
  if (collection === undefined) {
    return null;
  }
  const request = collection.requests.find((item) => item.id === requestId);
  if (request === undefined) {
    return null;
  }
  return { collection, request };
}
